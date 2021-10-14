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
    test.each([
        [
            "No-op for files without completed tasks",
            DEFAULT_SETTINGS,
            ["foo", "bar", "# Archived"],
            ["foo", "bar", "# Archived"],
        ],

        [
            "Moves a single task to an empty archive",
            DEFAULT_SETTINGS,
            ["- [x] foo", "- [ ] bar", "# Archived"],
            ["- [ ] bar", "# Archived", "", "- [x] foo", ""],
        ],

        [
            "Moves multiple tasks to the end of a populated archive",
            DEFAULT_SETTINGS,
            [
                "- [x] foo",
                "- [x] foo #2",
                "- [ ] bar",
                "- [x] foo #3",
                "# Archived",
                "",
                "- [x] Completed",
                "- [x] Completed #2",
                "",
            ],
            [
                "- [ ] bar",
                "# Archived",
                "",
                "- [x] Completed",
                "- [x] Completed #2",
                "- [x] foo",
                "- [x] foo #2",
                "- [x] foo #3",
                "",
            ],
        ],

        [
            "Moves sub-items with top-level items after the archive heading, indented with tabs",
            DEFAULT_SETTINGS,
            [
                "- [ ] bar",
                "# Archived",
                "- [x] Completed",
                "# After archive",
                "Other stuff",
                "- [x] foo",
                "\tstuff in the same block",
                "\t- Some info",
                "\t- [ ] A subtask",
            ],
            [
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
            ],
        ],

        [
            "Works only with top-level tasks",
            DEFAULT_SETTINGS,
            [
                "- [ ] bar",
                "\t- [x] completed sub-task",
                "- [x] foo",
                "# Archived",
            ],
            [
                "- [ ] bar",
                "\t- [x] completed sub-task",
                "# Archived",
                "",
                "- [x] foo",
                "",
            ],
        ],

        [
            "Supports numbered tasks",
            DEFAULT_SETTINGS,
            ["1. [x] foo", "# Archived"],
            ["# Archived", "", "1. [x] foo", ""],
        ],

        [
            "Appends an archive heading to the end of file with a newline if there isn't any",
            DEFAULT_SETTINGS,
            ["- Text", "1. [x] foo"],
            ["- Text", "", "# Archived", "", "1. [x] foo", ""],
        ],

        [
            "Escapes regex characters in the archive heading value",
            {
                ...DEFAULT_SETTINGS,
                archiveHeading: "[[Archived]]",
            },
            ["- [x] foo", "- [ ] bar", "# [[Archived]]"],
            ["- [ ] bar", "# [[Archived]]", "", "- [x] foo", ""],
        ],
    ])("%s", (_, settings, input, output) => {
        const archiver = new Archiver(settings);
        const result = archiver.archiveTasks(input).lines;
        expect(result).toEqual(output);
    });
});

describe("Date tree", () => {
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

    describe("Days", () => {
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
    });

    describe("Combining dates", () => {
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
