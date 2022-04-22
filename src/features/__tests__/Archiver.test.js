import moment from "moment";

import { Archiver } from "../Archiver";
import { DEFAULT_SETTINGS_FOR_TESTS, TestDependencies } from "./Util";


window.moment = moment;
const WEEK = "2021-01-W-1";
const DAY = "2021-01-01";
Date.now = () => new Date(DAY).getTime();

jest.mock("obsidian");

function buildArchiver(testDependencies, settings) {
    return new Archiver(
        testDependencies.mockVault,
        testDependencies.mockWorkspace,
        testDependencies.sectionParser,
        testDependencies.dateTreeResolver,
        settings
    );
}

async function archiveTasksAndCheckMessage(activeFileState, expectedMessage) {
    const [, message] = await archiveTasks(activeFileState, DEFAULT_SETTINGS_FOR_TESTS);
    expect(message).toEqual(expectedMessage);
}

async function archiveTasksAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const [testDependencies] = await archiveTasks(activeFileState, settings);
    expect(testDependencies.mockActiveFile.state).toEqual(expectedActiveFileState);
}

async function archiveTasks(activeFileState, settings) {
    const testDependencies = new TestDependencies(activeFileState, settings);
    const archiver = buildArchiver(testDependencies, settings);

    const message = await archiver.archiveTasksInActiveFile(
        testDependencies.editorFile
    );

    return [testDependencies, message];
}

describe("Moving top-level tasks to the archive", () => {
    test("Only normalizes whitespace when there are no completed tasks", async () => {
        await archiveTasksAndCheckActiveFile(
            ["foo", "bar", "# Archived"],
            ["foo", "bar", "# Archived", ""]
        );
    });

    test("Moves a single task to an empty archive", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo", "- [ ] bar", "# Archived"],
            ["- [ ] bar", "# Archived", "", "- [x] foo", ""]
        );
    });

    test("Moves a single task to an h2 archive", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo", "- [ ] bar", "## Archived"],
            ["- [ ] bar", "## Archived", "", "- [x] foo", ""]
        );
    });

    test("Handles multiple levels of indentation", async () => {
        await archiveTasksAndCheckActiveFile(
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
        await archiveTasksAndCheckActiveFile(
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

    test.each([
        [["- [x] foo", "- [x] foo #2", "\t- [x] foo #3"], "Archived 2 tasks"],
        [["- [ ] foo"], "No tasks to archive"],
    ])(
        "Reports the number of top-level archived tasks: %s -> %s",
        async (input, expected) => {
            await archiveTasksAndCheckMessage(input, expected);
        }
    );

    test("Moves sub-items with top-level items after the archive heading, indented with tabs", async () => {
        await archiveTasksAndCheckActiveFile(
            [
                "- [ ] bar",
                "# Archived",
                "- [x] Completed",
                "# After archive",
                "Other stuff",
                "- [x] foo",
                "  stuff in the same block",
                "\t- Some info",
                "\t- [ ] A subtask",
            ],
            [
                "- [ ] bar",
                "# Archived",
                "",
                "- [x] Completed",
                "- [x] foo",
                "  stuff in the same block",
                "\t- Some info",
                "\t- [ ] A subtask",
                "",
                "# After archive",
                "Other stuff",
            ]
        );
    });

    test("Works only with top-level tasks", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [ ] bar", "\t- [x] completed sub-task", "- [x] foo", "# Archived"],
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
        await archiveTasksAndCheckActiveFile(
            ["1. [x] foo", "# Archived"],
            ["# Archived", "", "1. [x] foo", ""]
        );
    });

    test("Escapes regex characters in the archive heading value", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo", "- [ ] bar", "# [[Archived]]"],
            ["- [ ] bar", "# [[Archived]]", "", "- [x] foo", ""],
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                archiveHeading: "[[Archived]]",
            }
        );
    });

    describe("Creating a new archive", () => {
        test("Appends an archive heading to the end of file with a newline if there isn't any", async () => {
            await archiveTasksAndCheckActiveFile(
                ["- Text", "1. [x] foo"],
                ["- Text", "", "# Archived", "", "1. [x] foo", ""]
            );
        });

        test("Doesn't add newlines around the archive heading if configured so", async () => {
            await archiveTasksAndCheckActiveFile(
                ["- [x] foo", "Some text"],
                ["Some text", "# Archived", "- [x] foo"],
                {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    addNewlinesAroundHeadings: false,
                }
            );
        });

        test("Pulls heading depth from the config", async () => {
            // TODO: this extra newline in the result is a bit clunky
            await archiveTasksAndCheckActiveFile(
                ["- [x] foo"],
                ["", "### Archived", "", "- [x] foo", ""],
                {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    archiveHeadingDepth: 3,
                }
            );
        });
    });
});

describe("Separate files", () => {
    test("Creates a new archive in a separate file", async () => {
        const [testDependencies] = await archiveTasks(["- [x] foo", "- [ ] bar"], {
            ...DEFAULT_SETTINGS_FOR_TESTS,
            archiveToSeparateFile: true,
        });

        expect(testDependencies.mockActiveFile.state).toEqual(["- [ ] bar"]);
        expect(testDependencies.mockArchiveFile.state).toEqual([
            "",
            "# Archived",
            "",
            "- [x] foo",
            "",
        ]);
    });
});

describe("Date tree", () => {
    test("Archives tasks under a bullet with the current week", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo", "- [ ] bar", "# Archived"],
            ["- [ ] bar", "# Archived", "", `- [[${WEEK}]]`, "\t- [x] foo", ""],
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                useWeeks: true,
            }
        );
    });

    test("Uses indentation values from settings", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo", "# Archived"],
            ["# Archived", "", `- [[${WEEK}]]`, "   - [x] foo", ""],
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                useWeeks: true,
                indentationSettings: {
                    useTab: false,
                    tabSize: 3,
                },
            }
        );
    });

    test("Appends tasks under the current week bullet if it exists", async () => {
        await archiveTasksAndCheckActiveFile(
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
            ],
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                useWeeks: true,
            }
        );
    });

    describe("Days", () => {
        test("Archives tasks under a bullet with the current day", async () => {
            await archiveTasksAndCheckActiveFile(
                ["- [x] foo", "- [ ] bar", "# Archived"],
                ["- [ ] bar", "# Archived", "", `- [[${DAY}]]`, "\t- [x] foo", ""],
                {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    useDays: true,
                }
            );
        });
    });

    describe("Combining dates", () => {
        test("Creates & indents weekly & daily blocks", async () => {
            await archiveTasksAndCheckActiveFile(
                ["- [x] foo", "- [ ] bar", "# Archived"],
                [
                    "- [ ] bar",
                    "# Archived",
                    "",
                    `- [[${WEEK}]]`,
                    `\t- [[${DAY}]]`,
                    "\t\t- [x] foo",
                    "",
                ],
                {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    useDays: true,
                    useWeeks: true,
                }
            );
        });

        test("The week is already in the tree", async () => {
            await archiveTasksAndCheckActiveFile(
                ["- [x] foo", "- [ ] bar", "# Archived", "", `- [[${WEEK}]]`],
                [
                    "- [ ] bar",
                    "# Archived",
                    "",
                    `- [[${WEEK}]]`,
                    `\t- [[${DAY}]]`,
                    "\t\t- [x] foo",
                    "",
                ],
                {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    useDays: true,
                    useWeeks: true,
                }
            );
        });

        test("The week and the day are already in the tree", async () => {
            await archiveTasksAndCheckActiveFile(
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
                ],
                {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    useDays: true,
                    useWeeks: true,
                }
            );
        });

        test("The day is there, but the week is not (the user has changed the configuration)", async () => {
            await archiveTasksAndCheckActiveFile(
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
                ],
                {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    useDays: true,
                    useWeeks: true,
                }
            );
        });
    });
});

async function deleteTasksAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const [testDependencies] = await deleteTasks(activeFileState, settings);
    expect(testDependencies.mockActiveFile.state).toEqual(expectedActiveFileState);
}

async function deleteTasks(activeFileState, settings) {
    const testDependencies = new TestDependencies(activeFileState, settings);
    const archiver = buildArchiver(testDependencies, settings);

    const message = await archiver.deleteTasksInActiveFile(testDependencies.editorFile);

    return [testDependencies, message];
}

describe("Deleting completed tasks", () => {
    test("Deletes completed tasks", async () => {
        await deleteTasksAndCheckActiveFile(["- [x] foo", "- [ ] bar"], ["- [ ] bar"]);
    });
});

async function archiveHeadingAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    cursor = { line: 0, ch: 0 },
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const testDependencies = await archiveHeading(activeFileState, cursor, settings);
    expect(testDependencies.mockActiveFile.state).toEqual(expectedActiveFileState);
}

async function archiveHeading(
    activeFileState,
    cursor = { line: 0, ch: 0 },
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const testDependencies = new TestDependencies(activeFileState, settings);
    const archiver = buildArchiver(testDependencies, settings);

    testDependencies.mockEditor.cursor = cursor;
    await archiver.archiveHeadingUnderCursor(testDependencies.mockEditor);

    return testDependencies;
}

describe("Archive heading under cursor", () => {
    test("Base case", async () => {
        await archiveHeadingAndCheckActiveFile(
            ["# h1", "", "# Archived", ""],
            ["", "# Archived", "", "## h1", ""]
        );
    });

    test("Single line heading", async () => {
        await archiveHeadingAndCheckActiveFile(
            ["# h1", "# Archived", ""],
            ["", "# Archived", "", "## h1"]
        );
    });

    test("Nested heading", async () => {
        await archiveHeadingAndCheckActiveFile(
            ["# h1", "## h2", "text", "# Archived", ""],
            ["# h1", "", "# Archived", "", "## h2", "text"],
            { line: 2, ch: 0 }
        );
    });

    test("No heading under cursor", async () => {
        await archiveHeadingAndCheckActiveFile(["text"], ["text"]);
    });

    test("Moves to separate file", async () => {
        const testDependencies = await archiveHeading(
            ["# h1", "# Archived", ""],
            undefined,
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                archiveToSeparateFile: true,
            }
        );

        // TODO: whitespace inconsistency
        expect(testDependencies.mockArchiveFile.state).toEqual([
            "",
            "# Archived",
            "## h1",
        ]);
    });
});