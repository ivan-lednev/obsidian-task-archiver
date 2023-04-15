import {
    archiveHeading,
    archiveHeadingAndCheckActiveFile,
    archiveTaskUnderCursorAndCheckActiveFile,
    archiveTasks,
    archiveTasksAndCheckActiveFile,
    archiveTasksAndCheckMessage,
    archiveTasksRecursivelyAndCheckActiveFile,
    deleteTasksAndCheckActiveFile,
} from "./test-util/ArchiveFeatureUtil";
import { createTFile } from "./test-util/TestUtil";

import { placeholders } from "../../Constants";
import { DEFAULT_SETTINGS_FOR_TESTS, TaskSortOrder } from "../../Settings";

const DAY = "2021-01-01";
const TIME = "2021-01-01T00:01";

Date.now = () => new Date(TIME).getTime();

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
                "",
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

    describe("Additional task pattern from configuration", () => {
        test("Reads the additional task pattern from the config", async () => {
            await archiveTasksAndCheckActiveFile(
                ["- [x] foo #task", "- [x] bar", "# Archived"],
                ["- [x] bar", "# Archived", "", "- [x] foo #task", ""],
                {
                    settings: {
                        ...DEFAULT_SETTINGS_FOR_TESTS,
                        additionalTaskPattern: "#task",
                    },
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
                    settings: {
                        ...DEFAULT_SETTINGS_FOR_TESTS,
                        addNewlinesAroundHeadings: false,
                    },
                }
            );
        });

        test("Pulls heading depth from the config", async () => {
            await archiveTasksAndCheckActiveFile(
                ["- [x] foo"],
                ["", "### Archived", "", "- [x] foo", ""],
                {
                    settings: {
                        ...DEFAULT_SETTINGS_FOR_TESTS,
                        archiveHeadingDepth: 3,
                    },
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
                    settings: {
                        ...DEFAULT_SETTINGS_FOR_TESTS,
                        archiveAllCheckedTaskTypes: true,
                    },
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
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    textReplacement: {
                        ...DEFAULT_SETTINGS_FOR_TESTS.textReplacement,
                        applyReplacement: true,
                    },
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
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    archiveToSeparateFile: true,
                },
            }
        );

        expect(mockActiveFile.state).toEqual(["- [ ] bar"]);
        expect(mockArchiveFile.state).toEqual(["", "# Archived", "", "- [x] foo", ""]);
    });

    test("Can archive to the root of a separate file", async () => {
        const { mockArchiveFile } = await archiveTasks(["- [x] foo"], {
            settings: {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                archiveToSeparateFile: true,
                archiveUnderHeading: false,
            },
        });

        expect(mockArchiveFile.state).toEqual(["", "- [x] foo", ""]);
    });

    test("Still archives under a heading when not archiving to a separate file and archiving to root is enabled", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo"],
            ["", "# Archived", "", "- [x] foo", ""],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    archiveToSeparateFile: false,
                    archiveUnderHeading: false,
                },
            }
        );
    });
});

describe("Deleting completed tasks", () => {
    test("Deletes completed tasks", async () => {
        await deleteTasksAndCheckActiveFile(["- [x] foo", "- [ ] bar"], ["- [ ] bar"]);
    });
});

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
            { cursor: { line: 1, ch: 0 } }
        );
    });
});

describe("Adding metadata to tasks", () => {
    const metadata = `(completed: ${placeholders.DATE}; source: ${placeholders.ACTIVE_FILE_NEW}; source path: ${placeholders.ACTIVE_FILE_PATH})`;
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
            { settings: settingsForTestingMetadata }
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
            { settings: settingsForTestingMetadata }
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
                    settings: {
                        ...settingsForTestingMetadata,
                        additionalMetadataBeforeArchiving: {
                            ...settingsForTestingMetadata.additionalMetadataBeforeArchiving,
                            metadata: placeholders.HEADING,
                        },
                    },
                }
            );
        });

        test("Uses file name as fallback", async () => {
            await archiveTasksAndCheckActiveFile(
                ["- [x] foo", "# Archived"],
                ["# Archived", "", `- [x] foo mock-file-base-name`, ""],
                {
                    settings: {
                        ...settingsForTestingMetadata,
                        additionalMetadataBeforeArchiving: {
                            ...settingsForTestingMetadata.additionalMetadataBeforeArchiving,
                            metadata: placeholders.HEADING,
                        },
                    },
                }
            );
        });
    });

    describe("Heading chain placeholder", () => {
        test("Base case", async () => {
            await archiveTasksAndCheckActiveFile(
                ["# h1", "## h2", "- [x] foo", "# Archived"],
                ["# h1", "## h2", "# Archived", "", `- [x] foo h1 > h2`, ""],
                {
                    settings: {
                        ...settingsForTestingMetadata,
                        additionalMetadataBeforeArchiving: {
                            ...settingsForTestingMetadata.additionalMetadataBeforeArchiving,
                            metadata: placeholders.HEADING_CHAIN,
                        },
                    },
                }
            );
        });

        test("Uses file name as fallback", async () => {
            await archiveTasksAndCheckActiveFile(
                ["- [x] foo", "# Archived"],
                ["# Archived", "", `- [x] foo mock-file-base-name`, ""],
                {
                    settings: {
                        ...settingsForTestingMetadata,
                        additionalMetadataBeforeArchiving: {
                            ...settingsForTestingMetadata.additionalMetadataBeforeArchiving,
                            metadata: placeholders.HEADING_CHAIN,
                        },
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
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    taskSortOrder: TaskSortOrder.NEWEST_FIRST,
                },
            }
        );
    });

    test("Sort alphabetically", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] c", "# Archived", "- [x] b", "- [x] a"],
            ["# Archived", "", "- [x] a", "- [x] b", "- [x] c", ""],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    sortAlphabetically: true,
                },
            }
        );
    });
});

describe("Rules", () => {
    describe("Statuses", () => {
        test("A single task gets archived to a different file", async () => {
            const deferredArchive = createTFile({ path: "deferred.md" });

            const { mockActiveFile } = await archiveTasks(["- [>] foo", "- [ ] bar"], {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    rules: [
                        {
                            statuses: ">",
                            defaultArchiveFileName: "deferred",
                            archiveToSeparateFile: true,
                        },
                    ],
                },
                vaultFiles: [deferredArchive],
            });

            expect(mockActiveFile.state).toEqual(["- [ ] bar"]);
            expect(deferredArchive.state).toEqual([
                "",
                "# Archived",
                "",
                "- [>] foo",
                "",
            ]);
        });

        test("Different files for different statuses", async () => {
            const deferredArchive = createTFile({ path: "deferred.md" });
            const cancelledArchive = createTFile({ path: "cancelled.md" });

            await archiveTasks(
                ["- [>] foo", "- [-] cancelled", "- [-] another one cancelled"],
                {
                    settings: {
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
                    vaultFiles: [deferredArchive, cancelledArchive],
                }
            );

            expect(deferredArchive.state).toEqual([
                "",
                "# Archived",
                "",
                "- [>] foo",
                "",
            ]);
            expect(cancelledArchive.state).toEqual([
                "",
                "# Archived",
                "",
                "- [-] cancelled",
                "- [-] another one cancelled",
                "",
            ]);
        });

        test("Custom date format in destination file name", async () => {
            const deferredArchive = createTFile({ path: "2021-deferred.md" });

            await archiveTasks(["- [>] foo", "- [ ] bar"], {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    rules: [
                        {
                            statuses: ">",
                            archiveToSeparateFile: true,
                            defaultArchiveFileName: `${placeholders.DATE}-deferred`,
                            dateFormat: "YYYY",
                        },
                    ],
                },
                vaultFiles: [deferredArchive],
            });

            expect(deferredArchive.state).toEqual([
                "",
                "# Archived",
                "",
                "- [>] foo",
                "",
            ]);
        });
    });

    describe("Path patterns", () => {
        test("Active file matches pattern", async () => {
            const deferredArchive = createTFile({ path: "deferred.md" });

            const { mockActiveFile } = await archiveTasks(["- [x] foo", "- [ ] bar"], {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    rules: [
                        {
                            pathPatterns: "folder/.*mock-file-base-name",
                            defaultArchiveFileName: "deferred",
                            archiveToSeparateFile: true,
                        },
                    ],
                },
                vaultFiles: [deferredArchive],
            });

            expect(mockActiveFile.state).toEqual(["- [ ] bar"]);
            expect(deferredArchive.state).toEqual([
                "",
                "# Archived",
                "",
                "- [x] foo",
                "",
            ]);
        });
    });

    describe("Combining different conditions", () => {
        test("A task matches only one condition", async () => {
            const deferredArchive = createTFile({ path: "deferred.md" });

            const { mockActiveFile } = await archiveTasks(["- [x] foo", "- [ ] bar"], {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    rules: [
                        {
                            pathPatterns: "folder/.*mock-file-base-name",
                            statuses: ">",
                            defaultArchiveFileName: "deferred",
                            archiveToSeparateFile: true,
                        },
                    ],
                },
                vaultFiles: [deferredArchive],
            });

            expect(mockActiveFile.state).toEqual([
                "- [ ] bar",
                "",
                "# Archived",
                "",
                "- [x] foo",
                "",
            ]);
            expect(deferredArchive.state).toEqual([]);
        });
    });
});

describe("Building a heading chain", () => {
    test.skip("Adds newlines after new headings", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo"],
            [
                "",
                "# Custom 1",
                "",
                "## Custom 2",
                "",
                "### Custom 3",
                "",
                "- [x] foo",
                "",
            ],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    headings: [
                        { text: "Custom 1" },
                        { text: "Custom 2" },
                        { text: "Custom 3" },
                    ],
                },
            }
        );
    });

    test("Placeholders get resolved", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo"],
            ["", `# mock-file-base-name ${DAY}`, "- [x] foo"],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    addNewlinesAroundHeadings: false,
                    headings: [
                        {
                            text: `${placeholders.ACTIVE_FILE_NEW} ${placeholders.DATE}`,
                        },
                    ],
                },
            }
        );
    });

    test("Resolves custom date placeholder", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo"],
            ["", "# 2021", "- [x] foo"],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    addNewlinesAroundHeadings: false,
                    headings: [{ text: placeholders.DATE, dateFormat: "YYYY" }],
                },
            }
        );
    });

    test("Respects the depth setting", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo"],
            ["", "## 1", "### 2", "- [x] foo"],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    addNewlinesAroundHeadings: false,
                    archiveHeadingDepth: 2,
                    headings: [{ text: "1" }, { text: "2" }],
                },
            }
        );
    });

    test("Skips archive heading when extracting", async () => {
        await archiveTasksAndCheckActiveFile(
            ["# File name", "## 1", "- [x] foo"],
            ["# File name", "## 1", "- [x] foo"],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    addNewlinesAroundHeadings: false,
                    archiveHeadingDepth: 2,
                    headings: [{ text: "1" }],
                },
            }
        );
    });

    test("Finds existing nested heading and merges with it", async () => {
        await archiveTasksAndCheckActiveFile(
            ["# File name", "- [x] foo", "## 1", "- [x] bar"],
            ["# File name", "## 1", "- [x] bar", "### 2", "- [x] foo"],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    addNewlinesAroundHeadings: false,
                    archiveHeadingDepth: 2,
                    headings: [{ text: "1" }, { text: "2" }],
                },
            }
        );
    });
});

describe("Building a list item chain", () => {
    test("Builds a custom list item tree", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo"],
            ["", "- Custom 1", "\t- Custom 2", "\t\t- [x] foo", ""],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    headings: [],
                    archiveUnderListItems: true,
                    listItems: [{ text: "Custom 1" }, { text: "Custom 2" }],
                },
            }
        );
    });

    test("Placeholders get resolved", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo"],
            ["", "- mock-file-base-name", "\t- 2021", "\t\t- [x] foo", ""],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    headings: [],
                    archiveUnderListItems: true,
                    listItems: [
                        { text: placeholders.ACTIVE_FILE_NEW },
                        { text: placeholders.DATE, dateFormat: "YYYY" },
                    ],
                },
            }
        );
    });

    test("Merges with existing list item content", async () => {
        await archiveTasksAndCheckActiveFile(
            [
                "- [x] foo",
                "# Archived",
                "",
                "- Custom 1",
                "\t- Custom 2",
                "\t\t- [x] bar",
            ],
            [
                "# Archived",
                "",
                "- Custom 1",
                "\t- Custom 2",
                "\t\t- [x] bar",
                "\t\t- [x] foo",
                "",
            ],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    archiveUnderListItems: true,
                    listItems: [{ text: "Custom 1" }, { text: "Custom 2" }],
                },
            }
        );
    });

    test("Respects different addition orders", async () => {
        await archiveTasksAndCheckActiveFile(
            [
                "- [x] new",
                "# Archived",
                "",
                "- Custom 1",
                "\t- Custom 2",
                "\t\t- [x] old",
            ],
            [
                "# Archived",
                "",
                "- Custom 1",
                "\t- Custom 2",
                "\t\t- [x] new",
                "\t\t- [x] old",
                "",
            ],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    archiveUnderListItems: true,
                    taskSortOrder: TaskSortOrder.NEWEST_FIRST,
                    listItems: [{ text: "Custom 1" }, { text: "Custom 2" }],
                },
            }
        );
    });

    test("Respects the switch", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] new"],
            ["", "# Archived", "", "- [x] new", ""],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    archiveUnderListItems: false,
                    taskSortOrder: TaskSortOrder.NEWEST_FIRST,
                    listItems: [{ text: "Custom 1" }, { text: "Custom 2" }],
                },
            }
        );
    });
});

describe("obsidian-tasks dates", () => {
    test("Get resolved in headings", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo ✅ 2023-01-01"],
            ["", "# 2023-01-01", "", "- [x] foo ✅ 2023-01-01", ""],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    headings: [
                        {
                            text: placeholders.OBSIDIAN_TASKS_COMPLETED_DATE,
                            // obsidianTasksCompletedDateFormat: DEFAULT_DATE_FORMAT,
                        },
                    ],
                },
            }
        );
    });

    test("Get resolved in list items", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo ✅ 2023-01-01"],
            ["", "- 2023-01-01", "\t- [x] foo ✅ 2023-01-01", ""],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    archiveUnderListItems: true,
                    listItems: [{ text: placeholders.OBSIDIAN_TASKS_COMPLETED_DATE }],
                    headings: [],
                },
            }
        );
    });

    test("Get resolved in file names", async () => {
        const fileWithDate = createTFile({ path: "2023-01-01.md" });

        await archiveTasks(["- [x] foo ✅ 2023-01-01"], {
            settings: {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                archiveUnderHeading: false,
                archiveToSeparateFile: true,
                defaultArchiveFileName: placeholders.OBSIDIAN_TASKS_COMPLETED_DATE,
            },
            vaultFiles: [fileWithDate],
        });

        expect(fileWithDate.state).toEqual(["", "- [x] foo ✅ 2023-01-01", ""]);
    });

    test("Work with custom formats in headings & lists", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo ✅ 2023-01-01"],
            ["", "# 2023", "", "- [x] foo ✅ 2023-01-01", ""],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    headings: [
                        {
                            text: placeholders.OBSIDIAN_TASKS_COMPLETED_DATE,
                            obsidianTasksCompletedDateFormat: "YYYY",
                        },
                    ],
                },
            }
        );
    });

    test("Work with custom formats in file names", async () => {
        const fileWithDate = createTFile({ path: "2023.md" });

        await archiveTasks(["- [x] foo ✅ 2023-01-01"], {
            settings: {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                archiveUnderHeading: false,
                archiveToSeparateFile: true,
                obsidianTasksCompletedDateFormat: "YYYY",
                defaultArchiveFileName: placeholders.OBSIDIAN_TASKS_COMPLETED_DATE,
            },
            vaultFiles: [fileWithDate],
        });

        expect(fileWithDate.state).toEqual(["", "- [x] foo ✅ 2023-01-01", ""]);
    });

    test("Tasks with different dates get to different files/headings/lists", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo ✅ 2023-01-01", "- [x] bar ✅ 2023-01-02"],
            [
                "",
                "# 2023-01-01",
                "",
                "- [x] foo ✅ 2023-01-01",
                "",
                "# 2023-01-02",
                "",
                "- [x] bar ✅ 2023-01-02",
                "",
            ],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    headings: [
                        {
                            text: placeholders.OBSIDIAN_TASKS_COMPLETED_DATE,
                        },
                    ],
                },
            }
        );
    });

    test("Items for different dates get sorted", async () => {
        await archiveTasksAndCheckActiveFile(
            [
                "- [x] foo ✅ 2023-01-01",
                "- [x] baz ✅ 2023-01-03",
                "- [x] bar ✅ 2023-01-02",
            ],
            [
                "",
                "# 2023-01-01",
                "",
                "- [x] foo ✅ 2023-01-01",
                "",
                "# 2023-01-02",
                "",
                "- [x] bar ✅ 2023-01-02",
                "",
                "# 2023-01-03",
                "",
                "- [x] baz ✅ 2023-01-03",
                "",
            ],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    headings: [
                        {
                            text: placeholders.OBSIDIAN_TASKS_COMPLETED_DATE,
                        },
                    ],
                },
            }
        );
    });
});

describe("Archive only if subtasks are done", () => {
    test("Skips tasks with incomplete subtasks during shallow archiving", async () => {
        await archiveTasksAndCheckActiveFile(
            ["- [x] foo", "\t- [ ] bar", "# Archived", ""],
            ["- [x] foo", "\t- [ ] bar", "# Archived", ""],
            {
                settings: {
                    ...DEFAULT_SETTINGS_FOR_TESTS,
                    archiveOnlyIfSubtasksAreDone: true,
                },
            }
        );
    });

    test("Skips tasks with incomplete subtasks during deep archiving", async () => {
        await archiveTasksRecursivelyAndCheckActiveFile(
            ["- [ ] foo", "\t- [x] bar", "\t\t- [ ] baz", "# Archived", ""],
            ["- [ ] foo", "\t- [x] bar", "\t\t- [ ] baz", "# Archived", ""],
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                archiveOnlyIfSubtasksAreDone: true,
            }
        );
    });

    test("Archives nested completed tasks during deep archiving", async () => {
        await archiveTasksRecursivelyAndCheckActiveFile(
            ["- [ ] foo", "\t- [x] bar", "\t\t- [ ] baz", "# Archived", ""],
            ["- [ ] foo", "\t- [x] bar", "\t\t- [ ] baz", "# Archived", ""],
            {
                ...DEFAULT_SETTINGS_FOR_TESTS,
                archiveOnlyIfSubtasksAreDone: true,
            }
        );
    });
});
