import moment from "moment";
import { Archiver } from "../Archiver";

const DEFAULT_SETTINGS = {
    archiveHeading: "Archived",
    weeklyNoteFormat: "YYYY-MM-[W]-w",
    useDateTree: false,
};

describe("Moving top-level tasks to the archive", () => {
    test("No-op for files without completed tasks", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = ["foo", "bar", "# Archived"];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual(lines);
    });

    test("No-op for files without an archive", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = ["- [x] foo", "bar"];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual(lines);
    });

    test("Moves a single task to an empty archive", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = ["- [x] foo", "- [ ] bar", "# Archived"];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual(["- [ ] bar", "# Archived", "- [x] foo"]);
    });

    test("Moves a single task to the end of a populated archive", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = [
            "- [x] foo",
            "- [ ] bar",
            "# Archived",
            "- [x] Completed",
            "- [x] Completed #2",
        ];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual([
            "- [ ] bar",
            "# Archived",
            "- [x] Completed",
            "- [x] Completed #2",
            "- [x] foo",
        ]);
    });

    test("Moves multiple tasks to the end of a populated archive", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = [
            "- [x] foo",
            "- [x] foo #2",
            "- [ ] bar",
            "- [x] foo #3",
            "# Archived",
            "- [x] Completed",
            "- [x] Completed #2",
        ];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual([
            "- [ ] bar",
            "# Archived",
            "- [x] Completed",
            "- [x] Completed #2",
            "- [x] foo",
            "- [x] foo #2",
            "- [x] foo #3",
        ]);
    });

    test("Moves sub-items with top-level items", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = [
            "- [ ] bar",
            "- [x] foo",
            "  stuff in the same block",
            "    - Some info",
            "    - [ ] A subtask",
            "# Archived",
            "- [x] Completed",
        ];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual([
            "- [ ] bar",
            "# Archived",
            "- [x] Completed",
            "- [x] foo",
            "  stuff in the same block",
            "    - Some info",
            "    - [ ] A subtask",
        ]);
    });

    test("Moves sub-items with top-level items after the archive heading, indented with tabs", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = [
            "- [ ] bar",
            "# Archived",
            "- [x] Completed",
            "# After archive",
            "Other stuff",
            "- [x] foo",
            "   stuff in the same block".replace("   ", "\t"),
            "   - Some info".replace("   ", "\t"),
            "   - [ ] A subtask".replace("   ", "\t"),
        ];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual([
            "- [ ] bar",
            "# Archived",
            "- [x] Completed",
            "- [x] foo",
            "   stuff in the same block".replace("   ", "\t"),
            "   - Some info".replace("   ", "\t"),
            "   - [ ] A subtask".replace("   ", "\t"),
            "# After archive",
            "Other stuff",
        ]);
    });

    test("Respects newlines around headings", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = [
            "- [x] foo",
            "",
            "",
            "# Archived",
            "",
            "",
            "- [x] Completed",
            "",
            "",
            "# Another heading",
        ];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual([
            "",
            "",
            "# Archived",
            "",
            "",
            "- [x] Completed",
            "- [x] foo",
            "",
            "",
            "# Another heading",
        ]);
    });

    test.skip("Adds newlines around headings when the archive heading is empty", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = ["- [x] foo", "", "# Archived", "", "# Another heading"];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual([
            "",
            "# Archived",
            "",
            "- [x] foo",
            "",
            "# Another heading",
        ]);
    });

    test("Archives tasks under a bullet with the current week", () => {
        const archiver = new Archiver({
            ...DEFAULT_SETTINGS,
            useDateTree: true,
        });
        const lines = ["- [x] foo", "- [ ] bar", "# Archived"];
        const result = archiver.archiveTasks(lines);
        const week = moment().format("YYYY-MM-[W]-w");
        expect(result).toEqual([
            "- [ ] bar",
            "# Archived",
            `- [[${week}]]`,
            "    - [x] foo",
        ]);
    });

    test("Appends tasks under the current week bullet if it exists", () => {
        const archiver = new Archiver({
            ...DEFAULT_SETTINGS,
            useDateTree: true,
        });
        const week = moment().format("YYYY-MM-[W]-w");
        const lines = [
            "- [x] foo",
            "- [ ] bar",
            "# Archived",
            `- [[${week}]]`,
            "    - [x] baz",
            "- Other stuff",
        ];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual([
            "- [ ] bar",
            "# Archived",
            `- [[${week}]]`,
            "    - [x] baz",
            "    - [x] foo",
            "- Other stuff",
        ]);
    });

    test("Works only with top-level tasks", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = [
            "- [ ] bar",
            "    - [x] completed sub-task",
            "- [x] foo",
            "# Archived",
        ];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual([
            "- [ ] bar",
            "    - [x] completed sub-task",
            "# Archived",
            "- [x] foo",
        ]);
    });

    test.skip("Detects sub-item indentation from newly completed tasks", () => {
        const archiver = new Archiver({
            ...DEFAULT_SETTINGS,
            useDateTree: true,
        });
        const week = moment().format("YYYY-MM-[W]-w");
        const lines = ["- [x] foo", "    - bar", "# Archived"];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual([
            "# Archived",
            `- [[${week}]]`,
            "\t- [x] foo",
            "\t\t- bar",
        ]);
    });
});
