import { Archiver } from "../archiver";

describe("Moving top-level tasks to the archive", () => {
    test("No-op for files without completed tasks", () => {
        const archiver = new Archiver();
        const lines = ["foo", "bar", "# Archived"];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual(lines);
    });

    test("No-op for files without an archive", () => {
        const archiver = new Archiver();
        const lines = ["- [x] foo", "bar"];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual(lines);
    });

    test("Moves a single task to an empty archive", () => {
        const archiver = new Archiver();
        const lines = ["- [x] foo", "- [ ] bar", "# Archived"];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual(["- [ ] bar", "# Archived", "- [x] foo"]);
    });

    test("Moves a single task to the end of a populated archive", () => {
        const archiver = new Archiver();
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
        const archiver = new Archiver();
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
        const archiver = new Archiver();
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
        const archiver = new Archiver();
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
        const archiver = new Archiver();
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

    test("Appends tasks under the current week", () => {
        const archiver = new Archiver(true);
        const lines = ["- [x] foo", "- [ ] bar", "# Archived"];
        const result = archiver.archiveTasks(lines);
        expect(result).toEqual([
            "- [ ] bar",
            "# Archived",
            "- [[week]]",
            "    - [x] foo",
        ]);
    });
});
