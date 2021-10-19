import moment from "moment";
import { Archiver } from "./Archiver";
import { ArchiverSettings } from "./ArchiverSettings";

window.moment = moment;

const WEEK = "2021-01-W-1";
const DAY = "2021-01-01";
const mockDate = jest.fn(() => new Date(DAY).valueOf());
Date.now = mockDate as jest.MockedFunction<typeof Date.now>;

const DEFAULT_SETTINGS: ArchiverSettings = {
    archiveHeading: "Archived",
    weeklyNoteFormat: "YYYY-MM-[W]-w",
    useWeeks: false,
    dailyNoteFormat: "YYYY-MM-DD",
    useDays: false,
    addNewlinesAroundHeadings: true,
    indentationSettings: {
        useTab: true,
        tabSize: 4,
    },
};

function checkArchiverOutput(
    settings: ArchiverSettings,
    input: string[],
    output: string[]
) {
    const archiver = new Archiver(settings);
    const result = archiver.archiveTasks(input).lines;
    expect(result).toEqual(output);
}

describe("Moving top-level tasks to the archive", () => {
    test("No-op for files without completed tasks", () => {
        checkArchiverOutput(
            DEFAULT_SETTINGS,
            ["foo", "bar", "# Archived"],
            ["foo", "bar", "# Archived"]
        );
    });

    test("Moves a single task to an empty archive", () => {
        checkArchiverOutput(
            DEFAULT_SETTINGS,
            ["- [x] foo", "- [ ] bar", "# Archived"],
            ["- [ ] bar", "# Archived", "", "- [x] foo", ""]
        );
    });

    test("Moves multiple tasks to the end of a populated archive", () => {
        checkArchiverOutput(
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
            ]
        );
    });

    test("Moves sub-items with top-level items after the archive heading, indented with tabs", () => {
        checkArchiverOutput(
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
            ]
        );
    });
    test("Works only with top-level tasks", () => {
        checkArchiverOutput(
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
            ]
        );
    });

    test("Supports numbered tasks", () => {
        checkArchiverOutput(
            DEFAULT_SETTINGS,
            ["1. [x] foo", "# Archived"],
            ["# Archived", "", "1. [x] foo", ""]
        );
    });

    test("Appends an archive heading to the end of file with a newline if there isn't any", () => {
        checkArchiverOutput(
            DEFAULT_SETTINGS,
            ["- Text", "1. [x] foo"],
            ["- Text", "", "# Archived", "", "1. [x] foo", ""]
        );
    });

    test("Escapes regex characters in the archive heading value", () => {
        checkArchiverOutput(
            {
                ...DEFAULT_SETTINGS,
                archiveHeading: "[[Archived]]",
            },
            ["- [x] foo", "- [ ] bar", "# [[Archived]]"],
            ["- [ ] bar", "# [[Archived]]", "", "- [x] foo", ""]
        );
    });

    test("Doesn't add newlines around the archive heading if configured so", () => {
        checkArchiverOutput(
            {
                ...DEFAULT_SETTINGS,
                addNewlinesAroundHeadings: false,
            },
            ["- [x] foo"],
            ["# Archived", "- [x] foo"]
        );
    });
});

describe("Date tree", () => {
    test("Archives tasks under a bullet with the current week", () => {
        checkArchiverOutput(
            {
                ...DEFAULT_SETTINGS,
                useWeeks: true,
            },
            ["- [x] foo", "- [ ] bar", "# Archived"],
            ["- [ ] bar", "# Archived", "", `- [[${WEEK}]]`, "\t- [x] foo", ""]
        );
    });

    test("Uses indentation values from settings", () => {
        checkArchiverOutput(
            {
                ...DEFAULT_SETTINGS,
                useWeeks: true,
                indentationSettings: {
                    useTab: false,
                    tabSize: 3,
                },
            },
            ["- [x] foo", "# Archived"],
            ["# Archived", "", `- [[${WEEK}]]`, "   - [x] foo", ""]
        );
    });

    test("Appends tasks under the current week bullet if it exists", () => {
        checkArchiverOutput(
            {
                ...DEFAULT_SETTINGS,
                useWeeks: true,
            },
            [
                "- [x] foo",
                "# Archived",
                "- [[old week]]",
                "\t- [x] old task",
                `- [[${WEEK}]]`,
                "\t- [x] baz",
            ],
            [
                "# Archived",
                "",
                "- [[old week]]",
                "\t- [x] old task",
                `- [[${WEEK}]]`,
                "\t- [x] baz",
                "\t- [x] foo",
                "",
            ]
        );
    });

    describe("Days", () => {
        test("Archives tasks under a bullet with the current day", () => {
            checkArchiverOutput(
                {
                    ...DEFAULT_SETTINGS,
                    useDays: true,
                },
                ["- [x] foo", "- [ ] bar", "# Archived"],
                [
                    "- [ ] bar",
                    "# Archived",
                    "",
                    `- [[${DAY}]]`,
                    "\t- [x] foo",
                    "",
                ]
            );
        });
    });

    describe("Combining dates", () => {
        test("Creates & indents weekly & daily blocks", () => {
            checkArchiverOutput(
                {
                    ...DEFAULT_SETTINGS,
                    useDays: true,
                    useWeeks: true,
                },
                ["- [x] foo", "- [ ] bar", "# Archived"],
                [
                    "- [ ] bar",
                    "# Archived",
                    "",
                    `- [[${WEEK}]]`,
                    `\t- [[${DAY}]]`,
                    "\t\t- [x] foo",
                    "",
                ]
            );
        });

        test("The week is already in the tree", () => {
            checkArchiverOutput(
                {
                    ...DEFAULT_SETTINGS,
                    useDays: true,
                    useWeeks: true,
                },
                ["- [x] foo", "- [ ] bar", "# Archived", "", `- [[${WEEK}]]`],
                [
                    "- [ ] bar",
                    "# Archived",
                    "",
                    `- [[${WEEK}]]`,
                    `\t- [[${DAY}]]`,
                    "\t\t- [x] foo",
                    "",
                ]
            );
        });

        test("The week and the day are already in the tree", () => {
            checkArchiverOutput(
                {
                    ...DEFAULT_SETTINGS,
                    useDays: true,
                    useWeeks: true,
                },
                [
                    "- [x] foo",
                    "- [ ] bar",
                    "# Archived",
                    "",
                    `- [[${WEEK}]]`,
                    `\t- [[${DAY}]]`,
                ],
                [
                    "- [ ] bar",
                    "# Archived",
                    "",
                    `- [[${WEEK}]]`,
                    `\t- [[${DAY}]]`,
                    "\t\t- [x] foo",
                    "",
                ]
            );
        });

        test("The day is there, but the week is not (the user has changed the configuration)", () => {
            checkArchiverOutput(
                {
                    ...DEFAULT_SETTINGS,
                    useDays: true,
                    useWeeks: true,
                },
                ["- [x] foo", "- [ ] bar", "# Archived", "", `- [[${DAY}]]`],
                [
                    "- [ ] bar",
                    "# Archived",
                    "",
                    `- [[${DAY}]]`,
                    `- [[${WEEK}]]`,
                    `\t- [[${DAY}]]`,
                    "\t\t- [x] foo",
                    "",
                ]
            );
        });
    });
});
