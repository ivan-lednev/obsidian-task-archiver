import moment from "moment";

import { DEFAULT_SETTINGS_FOR_TESTS, TestDependencies, createTFile } from "./TestUtil";

import { TaskSortOrder } from "../../Settings";
import { ArchiveFeature } from "../ArchiveFeature";

const WEEK = "2021-01-W-1";
const DAY = "2021-01-01";
const TIME = "2021-01-01T00:01";

window.moment = moment;
Date.now = () => new Date(TIME).getTime();

function buildArchiveFeature(testDependencies, settings) {
    return new ArchiveFeature(
        testDependencies.mockVault,
        testDependencies.mockWorkspace,
        testDependencies.sectionParser,
        testDependencies.dateTreeService,
        testDependencies.taskTestingService,
        testDependencies.placeholderService,
        testDependencies.textReplacementService,
        testDependencies.metadataService,
        settings
    );
}

async function archiveTasksAndCheckMessage(activeFileState, expectedMessage) {
    const { message } = await archiveTasks(activeFileState, DEFAULT_SETTINGS_FOR_TESTS);
    expect(message).toEqual(expectedMessage);
}

async function archiveTasksAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const { mockActiveFile } = await archiveTasks(activeFileState, settings);
    expect(mockActiveFile.state).toEqual(expectedActiveFileState);
}

async function archiveTasks(activeFileState, settings, vaultFiles = []) {
    const testDependencies = new TestDependencies(
        activeFileState,
        settings,
        vaultFiles
    );
    const archiveFeature = buildArchiveFeature(testDependencies, settings);

    const message = await archiveFeature.archiveShallowTasksInActiveFile(
        testDependencies.editorFile
    );

    return { ...testDependencies, message };
}

async function archiveTasksRecursivelyAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const {
        mockActiveFile: { state },
    } = await archiveTasksRecursively(activeFileState, settings);
    expect(state).toEqual(expectedActiveFileState);
}

async function archiveTasksRecursively(activeFileState, settings) {
    const testDependencies = new TestDependencies(activeFileState, settings);
    const archiveFeature = buildArchiveFeature(testDependencies, settings);

    const message = await archiveFeature.archiveDeepTasksInActiveFile(
        testDependencies.editorFile
    );

    return { ...testDependencies, message };
}

describe("Moving top-level tasks to the archive", () => {
    test("No-op when there are no completed tasks", async () => {
        await archiveTasksAndCheckActiveFile(
            ["foo", "bar", "# Archived"],
            ["foo", "bar", "# Archived"]
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

    describe("Additional task pattern from configuration", () => {
        test("Reads the additional task pattern from the config", async () => {
            await archiveTasksAndCheckActiveFile(
                ["- [x] foo #task", "- [x] bar", "# Archived"],
                ["- [x] bar", "# Archived", "", "- [x] foo #task", ""],
                {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    additionalTaskPattern: "#task",
                }
            );
        });
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
            await archiveTasksAndCheckActiveFile(
                ["- [x] foo"],
                ["", "### Archived", "", "- [x] foo", ""],
                {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    archiveHeadingDepth: 3,
                }
            );
        });

        test("Detects an existing archive heading at any level", async () => {
            await archiveTasksAndCheckActiveFile(
                ["# Top level heading", "- [x] foo", "### Archived"],
                ["# Top level heading", "### Archived", "", "- [x] foo", ""]
            );
        });
    });

    describe("Archive all checkmark types", () => {
        test("Ignores checked tasks by default", async () => {
            await archiveTasksAndCheckActiveFile(
                ["- [-] foo", "# Archived"],
                ["- [-] foo", "# Archived"]
            );
        });

        test("Basic case", async () => {
            await archiveTasksAndCheckActiveFile(
                ["- [-] foo", "# Archived"],
                ["# Archived", "", "- [-] foo", ""],
                {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    archiveAllCheckedTaskTypes: true,
                }
            );
        });
    });
});

describe("Archived block transformation", () => {
    test("Nested blocks", async () => {
        await archiveTasksAndCheckActiveFile(
            [
                "- [x] foo #task",
                "\t- other block #other-tag",
                "\t  some text #other-tag",
            ],
            [
                "",
                "# Archived",
                "",
                "- [x] foo @task",
                "\t- other block @other-tag",
                "\t  some text @other-tag",
                "",
            ],
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                textReplacement: {
                    ...DEFAULT_SETTINGS_FOR_TESTS.textReplacement,
                    applyReplacement: true,
                },
            }
        );
    });
});

describe("Moving top-level & inner tasks to the archive", () => {
    test("Basic case", async () => {
        await archiveTasksRecursivelyAndCheckActiveFile(
            ["- List item", "\t- [x] Completed inner task"],
            ["- List item", "", "# Archived", "", "- [x] Completed inner task", ""]
        );
    });
});

describe("Separate files", () => {
    test("Creates a new archive in a separate file", async () => {
        const { mockActiveFile, mockArchiveFile } = await archiveTasks(
            ["- [x] foo", "- [ ] bar"],
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                archiveToSeparateFile: true,
            }
        );

        expect(mockActiveFile.state).toEqual(["- [ ] bar"]);
        expect(mockArchiveFile.state).toEqual(["", "# Archived", "", "- [x] foo", ""]);
    });

    test("Can archive to the root of a separate file", async () => {
        const { mockArchiveFile } = await archiveTasks(["- [x] foo"], {
            ...DEFAULT_SETTINGS_FOR_TESTS,
            archiveToSeparateFile: true,
            archiveUnderHeading: false,
        });

        expect(mockArchiveFile.state).toEqual(["", "- [x] foo", ""]);
    });

    test("Still archives under a heading when not archiving to a separate file and archiving to root is enabled", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo"],
            ["", "# Archived", "", "- [x] foo", ""],
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                archiveToSeparateFile: false,
                archiveUnderHeading: false,
            }
        );
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
    const {
        mockActiveFile: { state },
    } = await deleteTasks(activeFileState, settings);

    expect(state).toEqual(expectedActiveFileState);
}

async function deleteTasks(activeFileState, settings) {
    const testDependencies = new TestDependencies(activeFileState, settings);
    const archiveFeature = buildArchiveFeature(testDependencies, settings);

    const message = await archiveFeature.deleteTasksInActiveFile(
        testDependencies.editorFile
    );

    return { ...testDependencies, message };
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
    const archiveFeature = buildArchiveFeature(testDependencies, settings);

    testDependencies.mockEditor.cursor = cursor;
    await archiveFeature.archiveHeadingUnderCursor(testDependencies.mockEditor);

    return testDependencies;
}

async function archiveTaskUnderCursorAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    cursor = { line: 0, ch: 0 },
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const {
        mockActiveFile: { state },
    } = await archiveTaskUnderCursor(activeFileState, cursor, settings);
    expect(state).toEqual(expectedActiveFileState);
}

async function archiveTaskUnderCursor(
    activeFileState,
    cursor = { line: 0, ch: 0 },
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const testDependencies = new TestDependencies(activeFileState, settings);
    const archiveFeature = buildArchiveFeature(testDependencies, settings);

    testDependencies.mockEditor.cursor = cursor;
    await archiveFeature.archiveTaskUnderCursor(testDependencies.mockEditor);

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
            ["# Archived", "", "## h1"]
        );
    });

    // TODO: add newlines around archive after archiving
    test("Nested heading", async () => {
        await archiveHeadingAndCheckActiveFile(
            ["# h1", "## h2", "text", "# Archived", ""],
            ["# h1", "# Archived", "", "## h2", "text"],
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

describe("Archive list item under cursor", () => {
    test("Base case", async () => {
        await archiveTaskUnderCursorAndCheckActiveFile(
            ["- [ ] task", "\t- sub-item", "- [x] completed task"],
            [
                "- [x] completed task",
                "",
                "# Archived",
                "",
                "- [x] task",
                "\t- sub-item",
                "",
            ]
        );
    });

    test("Cursor is not on the first task in the list", async () => {
        await archiveTaskUnderCursorAndCheckActiveFile(
            ["- [ ] 1", "- [ ] 2"],
            ["- [ ] 1", "", "# Archived", "", "- [x] 2", ""],
            { line: 1, ch: 0 }
        );
    });
});

describe("Adding metadata to tasks", () => {
    const metadata =
        "(completed: {{date}}; source: {{sourceFileName}}; source path: {{sourceFilePath}})";
    const metadataWithResolvedPlaceholders =
        "(completed: 2021-01-01; source: mock-file-base-name; source path: folder/sub-folder/mock-file-base-name)";
    const settingsForTestingMetadata = {
        ...DEFAULT_SETTINGS_FOR_TESTS,
        additionalMetadataBeforeArchiving: {
            ...DEFAULT_SETTINGS_FOR_TESTS.additionalMetadataBeforeArchiving,
            addMetadata: true,
            metadata,
        },
    };

    test("Placeholders in metadata get resolved", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo", "# Archived"],
            ["# Archived", "", `- [x] foo ${metadataWithResolvedPlaceholders}`, ""],
            settingsForTestingMetadata
        );
    });

    test("Metadata gets appended only to top-level tasks", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo", "\t- [x] bar", "# Archived"],
            [
                "# Archived",
                "",
                `- [x] foo ${metadataWithResolvedPlaceholders}`,
                "\t- [x] bar",
                "",
            ],
            settingsForTestingMetadata
        );
    });

    test("Appends metadata only to top-level tasks while archiving nested tasks", async () => {
        await archiveTasksRecursivelyAndCheckActiveFile(
            ["- [ ] foo", "\t- [x] bar", "\t\t- [x] baz", "# Archived"],
            [
                "- [ ] foo",
                "# Archived",
                "",
                `- [x] bar ${metadataWithResolvedPlaceholders}`,
                "\t- [x] baz",
                "",
            ],
            settingsForTestingMetadata
        );
    });

    describe("Heading placeholder", () => {
        test("Base case", async () => {
            await archiveTasksAndCheckActiveFile(
                ["# Source heading", "- [x] foo", "# Archived"],
                ["# Source heading", "# Archived", "", `- [x] foo Source heading`, ""],
                {
                    ...settingsForTestingMetadata,
                    additionalMetadataBeforeArchiving: {
                        ...settingsForTestingMetadata.additionalMetadataBeforeArchiving,
                        metadata: "{{heading}}",
                    },
                }
            );
        });

        test("Uses file name as fallback", async () => {
            await archiveTasksAndCheckActiveFile(
                ["- [x] foo", "# Archived"],
                ["# Archived", "", `- [x] foo mock-file-base-name`, ""],
                {
                    ...settingsForTestingMetadata,
                    additionalMetadataBeforeArchiving: {
                        ...settingsForTestingMetadata.additionalMetadataBeforeArchiving,
                        metadata: "{{heading}}",
                    },
                }
            );
        });
    });
});

describe("Sort orders", () => {
    test("Newest tasks at the top", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo", "# Archived", "- [x] old task"],
            ["# Archived", "", "- [x] foo", "- [x] old task", ""],
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                taskSortOrder: TaskSortOrder.NEWEST_FIRST,
            }
        );
    });

    test("Newest tasks at the top with a date tree", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo", "# Archived", "- [[2020-01-01]]", "\t- [x] old task"],
            [
                "# Archived",
                "",
                "- [[2021-01-W-1]]",
                "\t- [[2021-01-01]]",
                "\t\t- [x] foo",
                "- [[2020-01-01]]",
                "\t- [x] old task",
                "",
            ],
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                taskSortOrder: TaskSortOrder.NEWEST_FIRST,
                useDays: true,
                useWeeks: true,
            }
        );
    });
});

describe("Rules", () => {
    test("A single task gets archived to a different file", async () => {
        const deferredArchive = createTFile({ state: [], path: "deferred.md" });

        const { mockActiveFile } = await archiveTasks(
            ["- [>] foo", "- [ ] bar"],
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                rules: [
                    {
                        statuses: ">",
                        defaultArchiveFileName: "deferred",
                        archiveToSeparateFile: true,
                    },
                ],
            },
            [deferredArchive]
        );

        expect(mockActiveFile.state).toEqual(["- [ ] bar"]);
        expect(deferredArchive.state).toEqual(["", "# Archived", "", "- [>] foo", ""]);
    });

    test("Different files", async () => {
        const deferredArchive = createTFile({ state: [], path: "deferred.md" });
        const cancelledArchive = createTFile({ state: [], path: "cancelled.md" });

        await archiveTasks(
            ["- [>] foo", "- [-] cancelled", "- [-] another one cancelled"],
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                rules: [
                    {
                        statuses: ">",
                        defaultArchiveFileName: "deferred",
                        archiveToSeparateFile: true,
                    },
                    {
                        statuses: "-",
                        defaultArchiveFileName: "cancelled",
                        archiveToSeparateFile: true,
                    },
                ],
            },
            [deferredArchive, cancelledArchive]
        );

        expect(deferredArchive.state).toEqual(["", "# Archived", "", "- [>] foo", ""]);
        expect(cancelledArchive.state).toEqual([
            "",
            "# Archived",
            "",
            "- [-] cancelled",
            "- [-] another one cancelled",
            "",
        ]);
    });

    test("Custom date format in file name", async () => {
        const deferredArchive = createTFile({ state: [], path: "2021-deferred.md" });

        await archiveTasks(
            ["- [>] foo", "- [ ] bar"],
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                rules: [
                    {
                        statuses: ">",
                        archiveToSeparateFile: true,
                        defaultArchiveFileName: "{{date}}-deferred",
                        dateFormat: "YYYY",
                    },
                ],
            },
            [deferredArchive]
        );

        expect(deferredArchive.state).toEqual(["", "# Archived", "", "- [>] foo", ""]);
    });
});
