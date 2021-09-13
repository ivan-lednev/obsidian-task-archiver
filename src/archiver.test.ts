import moment from "moment";
import { Archiver } from "./Archiver";

window.moment = moment;

const DEFAULT_SETTINGS = {
    archiveHeading: "Archived",
    weeklyNoteFormat: "YYYY-MM-[W]-w",
    useWeeks: false,
    dailyNoteFormat: "YYYY-MM-DD",
    useDays: false,
    indentationSettings: {
        useTab: true,
        tabSize: 4,
    },
};

describe("Moving top-level tasks to the archive", () => {
    test("No-op for files without completed tasks", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = ["foo", "bar", "# Archived"];
        const result = archiver.archiveTasks(lines).lines;
        expect(result).toEqual(lines);
    });

    test("Moves a single task to an empty archive", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = ["- [x] foo", "- [ ] bar", "# Archived"];
        const result = archiver.archiveTasks(lines).lines;
        expect(result).toEqual([
            "- [ ] bar",
            "# Archived",
            "",
            "- [x] foo",
            "",
        ]);
    });

    test("Moves a single task to the end of a populated archive", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = [
            "- [x] foo",
            "- [ ] bar",
            "# Archived",
            "",
            "- [x] Completed",
            "- [x] Completed #2",
            "",
        ];
        const result = archiver.archiveTasks(lines).lines;
        expect(result).toEqual([
            "- [ ] bar",
            "# Archived",
            "",
            "- [x] Completed",
            "- [x] Completed #2",
            "- [x] foo",
            "",
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
            "",
            "- [x] Completed",
            "- [x] Completed #2",
            "",
        ];
        const result = archiver.archiveTasks(lines).lines;
        expect(result).toEqual([
            "- [ ] bar",
            "# Archived",
            "",
            "- [x] Completed",
            "- [x] Completed #2",
            "- [x] foo",
            "- [x] foo #2",
            "- [x] foo #3",
            "",
        ]);
    });

    test("Moves sub-items with top-level items", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = [
            "- [ ] bar",
            "- [x] foo",
            "  stuff in the same block",
            "\t- Some info",
            "\t- [ ] A subtask",
            "# Archived",
            "",
            "- [x] Completed",
            "",
        ];
        const result = archiver.archiveTasks(lines).lines;
        expect(result).toEqual([
            "- [ ] bar",
            "# Archived",
            "",
            "- [x] Completed",
            "- [x] foo",
            "  stuff in the same block",
            "\t- Some info",
            "\t- [ ] A subtask",
            "",
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
            "\tstuff in the same block",
            "\t- Some info",
            "\t- [ ] A subtask",
        ];
        const result = archiver.archiveTasks(lines).lines;
        expect(result).toEqual([
            "- [ ] bar",
            "# Archived",
            "",
            "- [x] Completed",
            "- [x] foo",
            "\tstuff in the same block",
            "\t- Some info",
            "\t- [ ] A subtask",
            "",
            "# After archive",
            "Other stuff",
        ]);
    });

    test("Uses indentation values from settings", () => {
        const archiver = new Archiver({
            ...DEFAULT_SETTINGS,
            useWeeks: true,
            indentationSettings: {
                useTab: false,
                tabSize: 3,
            },
        });
        const lines = ["- [x] foo", "# Archived"];
        const week = moment().format("YYYY-MM-[W]-w");
        const result = archiver.archiveTasks(lines).lines;
        expect(result).toEqual([
            "# Archived",
            "",
            `- [[${week}]]`,
            "   - [x] foo",
            "",
        ]);
    });

    test("Archives tasks under a bullet with the current week", () => {
        const archiver = new Archiver({
            ...DEFAULT_SETTINGS,
            useWeeks: true,
        });
        const lines = ["- [x] foo", "- [ ] bar", "# Archived"];
        const result = archiver.archiveTasks(lines).lines;
        const week = moment().format("YYYY-MM-[W]-w");
        expect(result).toEqual([
            "- [ ] bar",
            "# Archived",
            "",
            `- [[${week}]]`,
            "\t- [x] foo",
            "",
        ]);
    });

    test("Appends tasks under the current week bullet if it exists", () => {
        const archiver = new Archiver({
            ...DEFAULT_SETTINGS,
            useWeeks: true,
        });
        const week = moment().format("YYYY-MM-[W]-w");
        const lines = [
            "- [x] foo",
            "# Archived",
            "- [[old week]]",
            "\t- [x] old task",
            `- [[${week}]]`,
            "\t- [x] baz",
        ];
        const result = archiver.archiveTasks(lines).lines;
        expect(result).toEqual([
            "# Archived",
            "",
            "- [[old week]]",
            "\t- [x] old task",
            `- [[${week}]]`,
            "\t- [x] baz",
            "\t- [x] foo",
            "",
        ]);
    });

    test("Works only with top-level tasks", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = [
            "- [ ] bar",
            "\t- [x] completed sub-task",
            "- [x] foo",
            "# Archived",
        ];
        const result = archiver.archiveTasks(lines).lines;
        expect(result).toEqual([
            "- [ ] bar",
            "\t- [x] completed sub-task",
            "# Archived",
            "",
            "- [x] foo",
            "",
        ]);
    });

    test("Supports numbered tasks", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = ["1. [x] foo", "# Archived"];
        const result = archiver.archiveTasks(lines).lines;
        expect(result).toEqual(["# Archived", "", "1. [x] foo", ""]);
    });

    test("Appends an archive heading to the end of file with a newline if there isn't any", () => {
        const archiver = new Archiver(DEFAULT_SETTINGS);
        const lines = ["- Text", "1. [x] foo"];
        const result = archiver.archiveTasks(lines).lines;
        expect(result).toEqual([
            "- Text",
            "",
            "# Archived",
            "",
            "1. [x] foo",
            "",
        ]);
    });

    test("Escapes regex characters in the archive heading value", () => {
        const archiver = new Archiver({
            ...DEFAULT_SETTINGS,
            archiveHeading: "[[Archived]]",
        });
        const lines = ["- [x] foo", "- [ ] bar", "# [[Archived]]"];
        const result = archiver.archiveTasks(lines).lines;
        expect(result).toEqual([
            "- [ ] bar",
            "# [[Archived]]",
            "",
            "- [x] foo",
            "",
        ]);
    });

    describe("Using days in the date tree", () => {
        test("Archives tasks under a bullet with the current day", () => {
            const archiver = new Archiver({
                ...DEFAULT_SETTINGS,
                useDays: true,
            });
            const lines = ["- [x] foo", "- [ ] bar", "# Archived"];
            const result = archiver.archiveTasks(lines).lines;
            const day = moment().format(DEFAULT_SETTINGS.dailyNoteFormat);
            expect(result).toEqual([
                "- [ ] bar",
                "# Archived",
                "",
                `- [[${day}]]`,
                "\t- [x] foo",
                "",
            ]);
        });

        test("Creates & indents weekly & daily blocks", () => {
            const archiver = new Archiver({
                ...DEFAULT_SETTINGS,
                useDays: true,
                useWeeks: true,
            });
            const lines = ["- [x] foo", "- [ ] bar", "# Archived"];
            const result = archiver.archiveTasks(lines).lines;
            const week = moment().format(DEFAULT_SETTINGS.weeklyNoteFormat);
            const day = moment().format(DEFAULT_SETTINGS.dailyNoteFormat);
            expect(result).toEqual([
                "- [ ] bar",
                "# Archived",
                "",
                `- [[${week}]]`,
                `\t- [[${day}]]`,
                "\t\t- [x] foo",
                "",
            ]);
        });

        test("The week is already in the tree", () => {
            const archiver = new Archiver({
                ...DEFAULT_SETTINGS,
                useDays: true,
                useWeeks: true,
            });
            const week = moment().format(DEFAULT_SETTINGS.weeklyNoteFormat);
            const lines = [
                "- [x] foo",
                "- [ ] bar",
                "# Archived",
                "",
                `- [[${week}]]`,
            ];
            const result = archiver.archiveTasks(lines).lines;
            const day = moment().format(DEFAULT_SETTINGS.dailyNoteFormat);
            expect(result).toEqual([
                "- [ ] bar",
                "# Archived",
                "",
                `- [[${week}]]`,
                `\t- [[${day}]]`,
                "\t\t- [x] foo",
                "",
            ]);
        });

        test("The week and the day are already in the tree", () => {
            const archiver = new Archiver({
                ...DEFAULT_SETTINGS,
                useDays: true,
                useWeeks: true,
            });
            const week = moment().format(DEFAULT_SETTINGS.weeklyNoteFormat);
            const day = moment().format(DEFAULT_SETTINGS.dailyNoteFormat);
            const lines = [
                "- [x] foo",
                "- [ ] bar",
                "# Archived",
                "",
                `- [[${week}]]`,
                `\t- [[${day}]]`,
            ];
            const result = archiver.archiveTasks(lines).lines;
            expect(result).toEqual([
                "- [ ] bar",
                "# Archived",
                "",
                `- [[${week}]]`,
                `\t- [[${day}]]`,
                "\t\t- [x] foo",
                "",
            ]);
        });
        
        test("The day is there, but the week is not (the user has changed the configuration)", () => {
            const archiver = new Archiver({
                ...DEFAULT_SETTINGS,
                useDays: true,
                useWeeks: true,
            });
            const week = moment().format(DEFAULT_SETTINGS.weeklyNoteFormat);
            const day = moment().format(DEFAULT_SETTINGS.dailyNoteFormat);
            const lines = [
                "- [x] foo",
                "- [ ] bar",
                "# Archived",
                "",
                `- [[${day}]]`,
            ];
            const result = archiver.archiveTasks(lines).lines;
            expect(result).toEqual([
                "- [ ] bar",
                "# Archived",
                "",
                `- [[${day}]]`,
                `- [[${week}]]`,
                `\t- [[${day}]]`,
                "\t\t- [x] foo",
                "",
            ]);
        });
    });
});
