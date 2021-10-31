import { Parser, Section } from "./Parser";

const DEFAULT_SETTINGS = {
    useTab: true,
    tabSize: 2,
};

test("Builds a flat structure with non-hierarchical text", () => {
    const lines = [
        "text",
        "|table|",
        "|----|",
        "|row|",
        "|another row|",
        "**Bold**",
        "```",
        "code",
        "```",
        "    # Not a real heading #",
        "    - Not a real list",
        "---",
    ];

    const doc = new Parser(DEFAULT_SETTINGS).parse(lines);
    expect(doc.blocks.length).toBe(lines.length);
});

describe("Headings", () => {
    test("Text after a heading gets nested", () => {
        const lines = ["# H1", "line"];

        const root = new Parser(DEFAULT_SETTINGS).parse(lines);

        expect(root.sections.length).toBe(1);
        const h1 = root.sections[0];
        expect(h1.blocks.length).toBe(1);
    });

    test("A subheading creates another level of nesting", () => {
        const lines = ["# H1", "## H2", "line"];

        const doc = new Parser(DEFAULT_SETTINGS).parse(lines);

        const h1 = doc.sections[0];
        expect(h1.sections.length).toBe(1);
        const h2 = h1.sections[0];
        expect(h2.blocks.length).toBe(1);
    });

    test("A same-level heading doesn't get nested", () => {
        const lines = ["# H1", "## H2", "## H2-2"];

        const doc = new Parser(DEFAULT_SETTINGS).parse(lines);

        const h1 = doc.sections[0];
        expect(h1.sections.length).toBe(2);
    });

    test("A higher-level heading pops nesting", () => {
        const lines = ["# H1", "## H2", "# H1", "line"];

        const doc = new Parser(DEFAULT_SETTINGS).parse(lines);

        expect(doc.sections.length).toBe(2);
        const secondH1 = doc.sections[1];
        expect(secondH1.blocks.length).toBe(1);
    });
});

describe("List items", () => {
    test("Indented text after a list item gets nested", () => {
        const lines = ["- l", "\ttext"];

        const doc = new Parser(DEFAULT_SETTINGS).parse(lines);
        expect(doc.blocks.length).toBe(1);
        const listItem = doc.blocks[0];
        expect(listItem.blocks.length).toBe(1);
    });

    test("An indented list item creates another level of nesting", () => {
        const lines = ["- l", "\t- l2", "\t\ttext"];

        const doc = new Parser(DEFAULT_SETTINGS).parse(lines);
        const listItem = doc.blocks[0];
        const indentedListItem = listItem.blocks[0];
        expect(indentedListItem.blocks.length).toBe(1);
    });

    test("A same level list item doesn't get nested", () => {
        const lines = ["- l", "\t- l2", "\t- l2-2"];
        const doc = new Parser(DEFAULT_SETTINGS).parse(lines);
        const listItem = doc.blocks[0];
        expect(listItem.blocks.length).toBe(2);
    });

    test("A higher-level list item pops nesting", () => {
        const lines = ["- l", "\t- l2", "- l2-2"];
        const doc = new Parser(DEFAULT_SETTINGS).parse(lines);
        expect(doc.blocks.length).toBe(2);
    });

    test("A top-level line breaks out of a list context", () => {
        const lines = ["- l", "\t- l2", "line"];
        const doc = new Parser(DEFAULT_SETTINGS).parse(lines);
        expect(doc.blocks.length).toBe(2);
    });

    test.each([
        [2, ["- l", "  - l2", "    text", "", "  Top-level text"]],
        [4, ["- l", "    - l2", "      text", "", "    Top-level text"]],
    ])("Indentation with spaces of different lengths: %d", (tabSize, lines) => {
        const doc = new Parser({
            ...DEFAULT_SETTINGS,
            useTab: false,
            tabSize: tabSize,
        }).parse(lines);
        expect(doc.blocks.length).toBe(3);
        const listItem = doc.blocks[0];
        expect(listItem.blocks.length).toBe(1);
    });

    test.each([
        ["*", ["* l", "\t* l2", "\t\ttext"]],
        ["Numbers", ["1. l", "\t11. l2", "\t\ttext"]],
        ["Mixed", ["1. l", "\t* l2", "\t\ttext"]],
    ])("Different types of list markers: %s", (_, lines) => {
        const doc = new Parser(DEFAULT_SETTINGS).parse(lines);
        expect(doc.blocks.length).toBe(1);
        const listItem = doc.blocks[0];
        expect(listItem.blocks.length).toBe(1);
        const nestedListItem = listItem.blocks[0];
        expect(nestedListItem.blocks.length).toBe(1);
    });
});

describe("Mixing headings and lists", () => {
    test("One heading, one list", () => {
        const lines = ["# h", "- l", "line"];
        const doc = new Parser(DEFAULT_SETTINGS).parse(lines);
        expect(doc.sections.length).toBe(1);
        const h1 = doc.sections[0];
        expect(h1.blocks.length).toBe(2);
    });

    test("Multiple heading levels", () => {
        const lines = ["# h", "- l", "text", "## h2", "# h1"];
        const doc = new Parser(DEFAULT_SETTINGS).parse(lines);
        expect(doc.sections.length).toBe(2);
        const h1 = doc.sections[0];
        expect(h1.sections.length).toBe(1);
        expect(h1.blocks.length).toBe(2);
    });

    test("Multiple list levels", () => {
        const lines = ["# h", "- l", "    - l2", "# h1"];
        const doc = new Parser(DEFAULT_SETTINGS).parse(lines);
        expect(doc.sections.length).toBe(2);
        const h1 = doc.sections[0];
        expect(h1.blocks.length).toBe(1);
        const list = h1.blocks[0];
        expect(list.blocks.length).toBe(1);
    });
});

describe("Stringification", () => {
    test.each([
        [["Line", "Another line"]],
        [["# H1", "text", "## H2", "text", "# H1-2", "text"]],
        [["- l", "  text", "    - l", "text"]],
        [
            [
                "# H1",
                "- l1",
                "  indented",
                "    - l2",
                "text",
                "## h2",
                "- l1",
                "    - l2",
            ],
        ],
    ])("Roundtripping doesn't mutate lines: %s", (lines) => {
        const parsed = new Parser(DEFAULT_SETTINGS).parse(lines);
        const stringified = parsed.stringify();
        expect(stringified).toEqual(lines);
    });
});

// TODO: move this out into the AST files
describe("Extraction", () => {
    test("Extract top-level block with a filter", () => {
        const lines = ["Text", "Extract me"];
        const extracted = [["Extract me"]];
        const theRest = ["Text"];

        const parsed = new Parser(DEFAULT_SETTINGS).parse(lines);

        const actual = parsed
            .extractBlocksRecursively((line) => line === "Extract me")
            .map((b) => b.stringify());
        expect(actual).toEqual(extracted);
        expect(parsed.stringify()).toEqual(theRest);
    });
});
