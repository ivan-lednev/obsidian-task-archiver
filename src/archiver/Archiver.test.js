import moment from "moment";
import { Archiver } from "./Archiver";

window.moment = moment;
const WEEK = "2021-01-W-1";
const DAY = "2021-01-01";
const mockDate = jest.fn(() => new Date(DAY).valueOf());
Date.now = mockDate;

const DEFAULT_SETTINGS = {
    archiveHeading: "Archived",
    archiveHeadingDepth: 1,
    weeklyNoteFormat: "YYYY-MM-[W]-w",
    useWeeks: false,
    dailyNoteFormat: "YYYY-MM-DD",
    useDays: false,
    addNewlinesAroundHeadings: true,
    indentationSettings: {
        useTab: true,
        tabSize: 4,
    },
    archiveToSeparateFile: false,
    defaultArchiveFileName: "<filename> (archive)",
};

async function runArchiverWithMocks(input, settings = DEFAULT_SETTINGS) {
    const currentFile = {
        extension: "md",
    };
    const workspace = {
        getActiveFile: () => currentFile,
    };
    const read = jest.fn(() => input.join("\n"));
    const modify = jest.fn();
    const vault = { read, modify };
    const archiver = new Archiver(vault, workspace, settings);

    await archiver.archiveTasksToSameFile();

    return { read, modify };
}

async function checkVaultModifyOutput(
    input,
    output,
    settings = DEFAULT_SETTINGS
) {
    const { modify } = await runArchiverWithMocks(input, settings);
    expect(modify).toHaveBeenCalledWith(expect.anything(), output.join("\n"));
}

describe("Moving top-level tasks to the archive", () => {
    test("No-op for files without completed tasks", async () => {
        const input = ["foo", "bar", "# Archived"];

        const { modify } = await runArchiverWithMocks(input);

        expect(modify).not.toBeCalled();
    });

    test("Moves a single task to an empty archive", async () => {
        await checkVaultModifyOutput(
            ["- [x] foo", "- [ ] bar", "# Archived"],
            ["- [ ] bar", "# Archived", "", "- [x] foo", ""]
        );
    });

    test("Moves a single task to an h2 archive", async () => {
        await checkVaultModifyOutput(
            ["- [x] foo", "- [ ] bar", "## Archived"],
            ["- [ ] bar", "## Archived", "", "- [x] foo", ""]
        );
    });

    test("Handles multiple levels of indentation", async () => {
        await checkVaultModifyOutput(
            [
                "- [x] root",
                "\t- child 1",
                "\t\t- child 2",
                "\t\t\t- child 3",
                "\t\t\t\t- [x] child with tasks 4",
                "# Archived",
            ],
            [
                "# Archived",
                "",
                "- [x] root",
                "\t- child 1",
                "\t\t- child 2",
                "\t\t\t- child 3",
                "\t\t\t\t- [x] child with tasks 4",
                "",
            ]
        );
    });

    test("Moves multiple tasks to the end of a populated archive", async () => {
        await checkVaultModifyOutput(
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

    test.skip.each([
        [["- [x] foo", "- [x] foo #2", "\t- [x] foo #3"], "Archived 2 tasks"],
        [["- [ ] foo"], "No tasks to archive"],
    ])(
        "Reports the number of top-level archived tasks: %s -> %s",
        (input, message) => {
            const archiver = new Archiver(null, null, DEFAULT_SETTINGS);
            const result = archiver.archiveTasksToSameFile(input);
            expect(result.summary).toBe(message);
        }
    );

    test("Moves sub-items with top-level items after the archive heading, indented with tabs", async () => {
        await checkVaultModifyOutput(
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

    test("Works only with top-level tasks", async () => {
        await checkVaultModifyOutput(
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

    test("Supports numbered tasks", async () => {
        await checkVaultModifyOutput(
            ["1. [x] foo", "# Archived"],
            ["# Archived", "", "1. [x] foo", ""]
        );
    });

    test("Escapes regex characters in the archive heading value", async () => {
        await checkVaultModifyOutput(
            ["- [x] foo", "- [ ] bar", "# [[Archived]]"],
            ["- [ ] bar", "# [[Archived]]", "", "- [x] foo", ""],
            {
                ...DEFAULT_SETTINGS,
                archiveHeading: "[[Archived]]",
            }
        );
    });

    describe("Creating a new archive", () => {
        test("Appends an archive heading to the end of file with a newline if there isn't any", async () => {
            await checkVaultModifyOutput(
                ["- Text", "1. [x] foo"],
                ["- Text", "", "# Archived", "", "1. [x] foo", ""]
            );
        });

        test("Doesn't add newlines around the archive heading if configured so", async () => {
            await checkVaultModifyOutput(
                ["- [x] foo", "Some text"],
                ["Some text", "# Archived", "- [x] foo"],
                {
                    ...DEFAULT_SETTINGS,
                    addNewlinesAroundHeadings: false,
                }
            );
        });

        test("Pulls heading depth from the config", async () => {
            await checkVaultModifyOutput(
                ["- [x] foo"],
                ["### Archived", "", "- [x] foo", ""],
                {
                    ...DEFAULT_SETTINGS,
                    archiveHeadingDepth: 3,
                }
            );
        });
    });
});

describe.skip("Separate files", () => {
    test("Creates a new archive in a separate file", () => {
        const archiver = new Archiver(null, null, DEFAULT_SETTINGS);
        const { lines, archiveLines } = archiver.archiveTasksToSeparateFile(
            ["- [x] foo", "- [ ] bar"],
            []
        );
        expect(lines).toEqual(["- [ ] bar"]);

        expect(archiveLines).toEqual(["", "- [x] foo", ""]);
    });
});

describe.skip("Date tree", () => {
    test("Archives tasks under a bullet with the current week", () => {
        runArchiverWithMocks(
            {
                ...DEFAULT_SETTINGS,
                useWeeks: true,
            },
            ["- [x] foo", "- [ ] bar", "# Archived"],
            ["- [ ] bar", "# Archived", "", `- [[${WEEK}]]`, "\t- [x] foo", ""]
        );
    });

    test("Uses indentation values from settings", () => {
        runArchiverWithMocks(
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
        runArchiverWithMocks(
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
            runArchiverWithMocks(
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
            runArchiverWithMocks(
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
            runArchiverWithMocks(
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
            runArchiverWithMocks(
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
            runArchiverWithMocks(
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
