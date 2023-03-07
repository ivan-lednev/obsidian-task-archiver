import { DEFAULT_SETTINGS_FOR_TESTS, TestDependencies } from "./TestUtil";

import { ListToHeadingFeature } from "../ListToHeadingFeature";

function turnListItemsIntoHeadingsAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    cursor = { line: 0, ch: 0 },
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const testDependencies = new TestDependencies(activeFileState, settings);
    const listToHeadingFeature = new ListToHeadingFeature(
        testDependencies.sectionParser,
        settings
    );

    testDependencies.mockEditor.cursor = cursor;
    listToHeadingFeature.turnListItemsIntoHeadings(testDependencies.mockEditor);

    expect(testDependencies.mockActiveFile.state).toEqual(expectedActiveFileState);
}

test("No list under cursor", () => {
    turnListItemsIntoHeadingsAndCheckActiveFile(["text"], ["text"]);
});

test("Single list line", () => {
    turnListItemsIntoHeadingsAndCheckActiveFile(["- li"], ["# li", ""]);
});

test("One level of nesting, cursor at line 0", () => {
    turnListItemsIntoHeadingsAndCheckActiveFile(
        ["- li", "\t- li 2"],
        ["# li", "", "- li 2", ""]
    );
});

test("One level of nesting, cursor at nested list line", () => {
    turnListItemsIntoHeadingsAndCheckActiveFile(
        ["- li", "\t- li 2"],
        ["# li", "", "## li 2", ""],
        { line: 1, ch: 0 }
    );
});

test("Multiple levels of nesting, cursor in mid depth", () => {
    turnListItemsIntoHeadingsAndCheckActiveFile(
        ["- li 1", "\t- li 2", "\t\t- li 3", "\t\t\t\t- li 4", "\t\t\t\t\t- li 6"],
        ["# li 1", "", "## li 2", "", "### li 3", "", "- li 4", "\t- li 6", ""],
        { line: 2, ch: 0 }
    );
});

test("Heading above list determines starting depth", () => {
    turnListItemsIntoHeadingsAndCheckActiveFile(
        ["# h 1", "", "- li 1"],
        ["# h 1", "", "## li 1", ""],
        { line: 2, ch: 0 }
    );
});

test("Text after list item", () => {
    turnListItemsIntoHeadingsAndCheckActiveFile(
        ["- li 1", "  Text content 1", "  Text content 2"],
        ["# li 1", "", "Text content 1", "Text content 2", ""]
    );
});

test("Text after deeply nested list item", () => {
    turnListItemsIntoHeadingsAndCheckActiveFile(
        [
            "- li 1",
            "\t- li 2",
            "\t\t- li 3",
            "\t\t\t- li 4",
            "\t\t\t  Text content 1",
            "\t\t\t  Text content 2",
        ],
        [
            "# li 1",
            "",
            "## li 2",
            "",
            "### li 3",
            "",
            "#### li 4",
            "",
            "Text content 1",
            "Text content 2",
            "",
        ],
        { line: 3, ch: 0 }
    );
});

test("Respects newline settings", () => {
    turnListItemsIntoHeadingsAndCheckActiveFile(
        ["- li 1", "\t- li 2", "\t\t- li 3"],
        ["# li 1", "- li 2", "\t- li 3"],
        undefined,
        {
            ...DEFAULT_SETTINGS_FOR_TESTS,
            addNewlinesAroundHeadings: false,
        }
    );
});

test("Respects indentation settings", () => {
    turnListItemsIntoHeadingsAndCheckActiveFile(
        ["- li 1", "    - li 2", "        - li 3"],
        ["# li 1", "", "## li 2", "", "### li 3", ""],
        { line: 2, ch: 0 },
        {
            ...DEFAULT_SETTINGS_FOR_TESTS,
            indentationSettings: {
                useTab: false,
                tabSize: 4,
            },
        }
    );
});

test("Tasks in list", () => {
    turnListItemsIntoHeadingsAndCheckActiveFile(["- [x] li"], ["# li", ""]);
});

test("Numbered lists", () => {
    turnListItemsIntoHeadingsAndCheckActiveFile(["11. li"], ["# li", ""]);
});

test("Different list tokens", () => {
    turnListItemsIntoHeadingsAndCheckActiveFile(
        ["* li", "\t+ li 2"],
        ["# li", "", "+ li 2", ""]
    );
});
