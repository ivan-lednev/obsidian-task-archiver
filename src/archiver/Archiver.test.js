import moment from "moment";
import { Archiver } from "./Archiver";
import { SectionParser } from "../parser/SectionParser";
import { DateTreeResolver } from "./DateTreeResolver";
import { BlockParser } from "../parser/BlockParser";

window.moment = moment;
const WEEK = "2021-01-W-1";
const DAY = "2021-01-01";
Date.now = jest.fn(() => new Date(DAY).valueOf());

jest.mock("obsidian");

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

async function assertActiveFileModified(
    input,
    expectedOutput,
    settings = DEFAULT_SETTINGS
) {
    const { vault } = await archiveCompletedTasks(input, settings);
    expect(vault.modify).toHaveBeenCalledWith(
        expect.anything(),
        expectedOutput.join("\n")
    );
}

async function archiveCompletedTasks(input, settings = DEFAULT_SETTINGS) {
    const { vault, archiver } = buildArchiver(input, settings);
    const message = await archiver.archiveTasksInActiveFile();
    return { vault, message };
}

function buildArchiver(input, settings) {
    const TFileMock = jest.requireMock("obsidian").TFile;
    // We need this for instanceof checks to work
    const archiveFile = Object.assign(Object.create(TFileMock.prototype), {
        extension: "md",
    });
    const vault = {
        read: jest
            .fn()
            .mockImplementationOnce(() => input.join("\n"))
            .mockImplementationOnce(() => ""),
        modify: jest.fn(),
        getAbstractFileByPath: jest.fn(() => archiveFile),
    };
    const workspace = {
        getActiveFile: () => ({
            extension: "md",
        }),
    };

    const archiver = new Archiver(
        vault,
        workspace,
        new SectionParser(new BlockParser(settings.indentationSettings)),
        new DateTreeResolver(settings),
        settings
    );
    return {
        vault,
        archiver,
    };
}

async function deleteCompletedTasks(input, settings = DEFAULT_SETTINGS) {
    const { vault, archiver } = buildArchiver(input, settings);
    const message = await archiver.deleteTasksInActiveFile();
    return { vault, message };
}

describe("Moving top-level tasks to the archive", () => {
    test("No-op for files without completed tasks", async () => {
        const input = ["foo", "bar", "# Archived"];

        const { vault } = await archiveCompletedTasks(input);

        expect(vault.modify).not.toBeCalled();
    });

    test("Moves a single task to an empty archive", async () => {
        await assertActiveFileModified(
            ["- [x] foo", "- [ ] bar", "# Archived"],
            ["- [ ] bar", "# Archived", "", "- [x] foo", ""]
        );
    });

    test("Moves a single task to an h2 archive", async () => {
        await assertActiveFileModified(
            ["- [x] foo", "- [ ] bar", "## Archived"],
            ["- [ ] bar", "## Archived", "", "- [x] foo", ""]
        );
    });

    test("Handles multiple levels of indentation", async () => {
        await assertActiveFileModified(
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
        await assertActiveFileModified(
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
            const { message } = await archiveCompletedTasks(input);
            expect(message).toBe(expected);
        }
    );

    test("Moves sub-items with top-level items after the archive heading, indented with tabs", async () => {
        await assertActiveFileModified(
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
        await assertActiveFileModified(
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
        await assertActiveFileModified(
            ["1. [x] foo", "# Archived"],
            ["# Archived", "", "1. [x] foo", ""]
        );
    });

    test("Escapes regex characters in the archive heading value", async () => {
        await assertActiveFileModified(
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
            await assertActiveFileModified(
                ["- Text", "1. [x] foo"],
                ["- Text", "", "# Archived", "", "1. [x] foo", ""]
            );
        });

        test("Doesn't add newlines around the archive heading if configured so", async () => {
            await assertActiveFileModified(
                ["- [x] foo", "Some text"],
                ["Some text", "# Archived", "- [x] foo"],
                {
                    ...DEFAULT_SETTINGS,
                    addNewlinesAroundHeadings: false,
                }
            );
        });

        test("Pulls heading depth from the config", async () => {
            await assertActiveFileModified(
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

describe("Deleting completed tasks", () => {
    test("Deletes completed tasks", async () => {
        const input = ["- [x] foo", "- [ ] bar"];

        const { vault } = await deleteCompletedTasks(input);
        expect(vault.modify).toHaveBeenCalledTimes(1);
        expect(vault.modify).toHaveBeenCalledWith(expect.anything(), "- [ ] bar");
    });
});

describe("Separate files", () => {
    test("Creates a new archive in a separate file", async () => {
        const input = ["- [x] foo", "- [ ] bar"];

        const { vault } = await archiveCompletedTasks(input, {
            ...DEFAULT_SETTINGS,
            archiveToSeparateFile: true,
        });

        expect(vault.modify).toHaveBeenNthCalledWith(
            1,
            expect.anything(),
            "\n# Archived\n\n- [x] foo\n"
        );

        expect(vault.modify).toHaveBeenNthCalledWith(2, expect.anything(), "- [ ] bar");
    });
});

describe("Date tree", () => {
    test("Archives tasks under a bullet with the current week", async () => {
        await assertActiveFileModified(
            ["- [x] foo", "- [ ] bar", "# Archived"],
            ["- [ ] bar", "# Archived", "", `- [[${WEEK}]]`, "\t- [x] foo", ""],
            {
                ...DEFAULT_SETTINGS,
                useWeeks: true,
            }
        );
    });

    test("Uses indentation values from settings", async () => {
        await assertActiveFileModified(
            ["- [x] foo", "# Archived"],
            ["# Archived", "", `- [[${WEEK}]]`, "   - [x] foo", ""],
            {
                ...DEFAULT_SETTINGS,
                useWeeks: true,
                indentationSettings: {
                    useTab: false,
                    tabSize: 3,
                },
            }
        );
    });

    test("Appends tasks under the current week bullet if it exists", async () => {
        await assertActiveFileModified(
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
                ...DEFAULT_SETTINGS,
                useWeeks: true,
            }
        );
    });

    describe("Days", () => {
        test("Archives tasks under a bullet with the current day", async () => {
            await assertActiveFileModified(
                ["- [x] foo", "- [ ] bar", "# Archived"],
                ["- [ ] bar", "# Archived", "", `- [[${DAY}]]`, "\t- [x] foo", ""],
                {
                    ...DEFAULT_SETTINGS,
                    useDays: true,
                }
            );
        });
    });

    describe("Combining dates", () => {
        test("Creates & indents weekly & daily blocks", async () => {
            await assertActiveFileModified(
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
                    ...DEFAULT_SETTINGS,
                    useDays: true,
                    useWeeks: true,
                }
            );
        });

        test("The week is already in the tree", async () => {
            await assertActiveFileModified(
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
                    ...DEFAULT_SETTINGS,
                    useDays: true,
                    useWeeks: true,
                }
            );
        });

        test("The week and the day are already in the tree", async () => {
            assertActiveFileModified(
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
                    ...DEFAULT_SETTINGS,
                    useDays: true,
                    useWeeks: true,
                }
            );
        });

        test("The day is there, but the week is not (the user has changed the configuration)", async () => {
            await assertActiveFileModified(
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
                    ...DEFAULT_SETTINGS,
                    useDays: true,
                    useWeeks: true,
                }
            );
        });
    });
});
