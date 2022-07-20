import { DEFAULT_SETTINGS_FOR_TESTS, TestDependencies } from "./Util";

import { TaskListSorter } from "../TaskListSorter";

function sortListUnderCursorAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const testDependencies = new TestDependencies(activeFileState, settings);
    const sorter = new TaskListSorter(
        testDependencies.sectionParser,
        testDependencies.taskTester,
        settings
    );

    sorter.sortListUnderCursor(testDependencies.mockEditor);

    expect(testDependencies.mockActiveFile.state).toEqual(expectedActiveFileState);
}

test("No list under cursor", () => {
    sortListUnderCursorAndCheckActiveFile(["text"], ["text"]);
});

test("One level of sorting, mixed entries", () => {
    sortListUnderCursorAndCheckActiveFile(
        [
            "- [x] completed 1",
            "- text 1",
            "- [ ] incomplete 1",
            "- text 2",
            "- [x] completed 2",
            "- text 3",
        ],
        [
            "- text 1",
            "- text 2",
            "- text 3",
            "- [ ] incomplete 1",
            "- [x] completed 1",
            "- [x] completed 2",
        ]
    );
});

test("Multiple levels of nesting", () => {
    sortListUnderCursorAndCheckActiveFile(
        [
            "- [x] completed",
            "\t- [x] completed",
            "\t- [ ] incomplete",
            "\t- text 1",
            "- [ ] incomplete",
            "\t- text",
            "\t\t- [x] completed",
            "\t\t- text",
        ],
        [
            "- [ ] incomplete",
            "\t- text",
            "\t\t- text",
            "\t\t- [x] completed",
            "- [x] completed",
            "\t- text 1",
            "\t- [ ] incomplete",
            "\t- [x] completed",
        ]
    );
});

test("Text under list item", () => {
    sortListUnderCursorAndCheckActiveFile(
        [
            "- [ ] incomplete",
            "  text under list item",
            "  text under list item 2",
            "- text",
            "\t- text",
            "\t\t- [x] completed",
            "\t\t  text under list item",
            "\t\t  text under list item 2",
            "\t\t- text",
        ],
        [
            "- text",
            "\t- text",
            "\t\t- text",
            "\t\t- [x] completed",
            "\t\t  text under list item",
            "\t\t  text under list item 2",
            "- [ ] incomplete",
            "  text under list item",
            "  text under list item 2",
        ]
    );
});
