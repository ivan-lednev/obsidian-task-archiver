import { SectionParser } from "./SectionParser";
import { TextBlock } from "../model/TextBlock";
import { buildIndentation, findBlockRecursively } from "../Util";
import { BlockParser } from "./BlockParser";

const DEFAULT_SETTINGS = {
    useTab: true,
    tabSize: 2,
};
const DEFAULT_INDENTATION = buildIndentation(DEFAULT_SETTINGS);

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

    const doc = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);
    expect(doc.blockContent.children.length).toBe(lines.length);
});

describe("Headings", () => {
    test("Text after a heading gets nested", () => {
        const lines = ["# H1", "line"];

        const root = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);

        expect(root.children.length).toBe(1);
        const h1 = root.children[0];
        expect(h1.blockContent.children.length).toBe(1);
    });

    test("A subheading creates another level of nesting", () => {
        const lines = ["# H1", "## H2", "line"];

        const doc = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);

        const h1 = doc.children[0];
        expect(h1.children.length).toBe(1);
        const h2 = h1.children[0];
        expect(h2.blockContent.children.length).toBe(1);
    });

    test("A same-level heading doesn't get nested", () => {
        const lines = ["# H1", "## H2", "## H2-2"];

        const doc = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);

        const h1 = doc.children[0];
        expect(h1.children.length).toBe(2);
    });

    test("A higher-level heading pops nesting", () => {
        const lines = ["# H1", "## H2", "# H1", "line"];

        const doc = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);

        expect(doc.children.length).toBe(2);
        const secondH1 = doc.children[1];
        expect(secondH1.blockContent.children.length).toBe(1);
    });

    test("Doesn't break when the user jumps over a level", () => {
        const lines = ["# H1", "#### H4", "Text", "## H2"];

        const doc = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);
        expect(doc.children.length).toBe(1);
        expect(doc.children[0].children.length).toBe(2);
    });
});

describe("List items", () => {
    test("Indented text after a list item gets nested", () => {
        const lines = ["- l", "\ttext"];

        const doc = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);
        expect(doc.blockContent.children.length).toBe(1);
        const listItem = doc.blockContent.children[0];
        expect(listItem.children.length).toBe(1);
    });

    test("An indented list item creates another level of nesting", () => {
        const lines = ["- l", "\t- l2", "\t\ttext"];

        const doc = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);
        const listItem = doc.blockContent.children[0];
        const indentedListItem = listItem.children[0];
        expect(indentedListItem.children.length).toBe(1);
    });

    test("A same level list item doesn't get nested", () => {
        const lines = ["- l", "\t- l2", "\t- l2-2"];
        const doc = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);
        const listItem = doc.blockContent.children[0];
        expect(listItem.children.length).toBe(2);
    });

    test("A higher-level list item pops nesting", () => {
        const lines = ["- l", "\t- l2", "- l2-2"];
        const doc = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);
        expect(doc.blockContent.children.length).toBe(2);
    });

    test("Multiple list items on different levels with spaces", () => {
        const lines = [
            "- 1",
            "    - 1a",
            "        - 1a1",
            "            - 1a1a",
            "    - 1b",
        ];

        const doc = new SectionParser(
            new BlockParser({
                ...DEFAULT_SETTINGS,
                useTab: false,
                tabSize: 4,
            })
        ).parse(lines);
        expect(doc.blockContent.children.length).toBe(1);
    });

    test("A top-level line breaks out of a list context", () => {
        const lines = ["- l", "\t- l2", "line"];
        const doc = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);
        expect(doc.blockContent.children.length).toBe(2);
    });

    test.each([
        [2, ["- l", "  - l2", "    text", "", "  Top-level text"]],
        [4, ["- l", "    - l2", "      text", "", "    Top-level text"]],
    ])("Indentation with spaces of different lengths: %d", (tabSize, lines) => {
        const doc = new SectionParser(
            new BlockParser({
                ...DEFAULT_SETTINGS,
                useTab: false,
                tabSize: tabSize,
            })
        ).parse(lines);
        expect(doc.blockContent.children.length).toBe(3);
        const listItem = doc.blockContent.children[0];
        expect(listItem.children.length).toBe(1);
    });

    test.each([
        ["*", ["* l", "\t* l2", "\t\ttext"]],
        ["Numbers", ["1. l", "\t11. l2", "\t\ttext"]],
        ["Mixed", ["1. l", "\t* l2", "\t\ttext"]],
    ])("Different types of list markers: %s", (_, lines) => {
        const doc = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);
        expect(doc.blockContent.children.length).toBe(1);
        const listItem = doc.blockContent.children[0];
        expect(listItem.children.length).toBe(1);
        const nestedListItem = listItem.children[0];
        expect(nestedListItem.children.length).toBe(1);
    });

    test("Handles misaligned lists", () => {
        const lines = ["- l", "  - text"];

        const doc = new SectionParser(
            new BlockParser({
                ...DEFAULT_SETTINGS,
                useTab: false,
                tabSize: 4,
            })
        ).parse(lines);
        expect(doc.blockContent.children.length).toBe(1);
    });
});

describe("Mixing headings and lists", () => {
    test("One heading, one list", () => {
        const lines = ["# h", "- l", "line"];
        const doc = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);
        expect(doc.children.length).toBe(1);
        const h1 = doc.children[0];
        expect(h1.blockContent.children.length).toBe(2);
    });

    test("Multiple heading levels", () => {
        const lines = ["# h", "- l", "text", "## h2", "# h1"];
        const doc = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);
        expect(doc.children.length).toBe(2);
        const h1 = doc.children[0];
        expect(h1.children.length).toBe(1);
        expect(h1.blockContent.children.length).toBe(2);
    });

    test("Multiple list levels", () => {
        const lines = ["# h", "- l", "\t- l2", "# h1"];
        const doc = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(lines);
        expect(doc.children.length).toBe(2);
        const h1 = doc.children[0];
        expect(h1.blockContent.children.length).toBe(1);
        const list = h1.blockContent.children[0];
        expect(list.children.length).toBe(1);
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
    ])("Round-tripping respects indentation settings: %s", (lines) => {
        const settings = { useTab: false, tabSize: 4 };
        const parsed = new SectionParser(new BlockParser(settings)).parse(lines);
        const stringified = parsed.stringify(buildIndentation(settings));
        expect(stringified).toEqual(lines);
    });
});

// TODO: move this out into the AST files
describe("Extraction", () => {
    test("Extract top-level block with a filter", () => {
        const lines = ["Text", "Extract me"];
        const extracted = [["Extract me"]];
        const theRest = ["Text"];

        const parsed = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(
            lines
        );

        const actual = parsed
            .extractBlocksRecursively({
                blockFilter: (block) => block.text === "Extract me",
            })
            .map((b) => b.stringify(DEFAULT_INDENTATION));
        expect(actual).toEqual(extracted);
        expect(parsed.stringify(DEFAULT_INDENTATION)).toEqual(theRest);
    });
});

describe("Insertion", () => {
    test("Append a block", () => {
        const lines = ["- list", "- text"];

        const parsed = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(
            lines
        );
        parsed.blockContent.appendChild(new TextBlock("more text"));
        const stringified = parsed.stringify(DEFAULT_INDENTATION);
        expect(stringified).toEqual(["- list", "- text", "more text"]);
    });

    test("Automatically adds indentation to a text block after a list item", () => {
        const lines = ["- list"];

        const parsed = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(
            lines
        );
        parsed.blockContent.children[0].appendChild(new TextBlock("indented text"));
        expect(parsed.stringify(DEFAULT_INDENTATION)).toEqual([
            "- list",
            "  indented text",
        ]);
    });
});

// TODO: doesn't belong here
describe("Block search", () => {
    test("Find a block matching a matcher", () => {
        const lines = ["- list", "\t- text"];
        const parsed = new SectionParser(new BlockParser(DEFAULT_SETTINGS)).parse(
            lines
        );

        const searchResult = findBlockRecursively(parsed.blockContent.children, (b) =>
            b.text.includes("text")
        );

        expect(searchResult.stringify(DEFAULT_INDENTATION)[0]).toBe("- text");
    });
});

test("recalculateTokenLevels", () => {
    const parser = new SectionParser(new BlockParser(DEFAULT_SETTINGS));
    const root = parser.parse(["# h1"]).children[0];
    const child = parser.parse(["# h2"]).children[0];

    root.appendChild(child);
    root.recalculateTokenLevels();

    expect(root.stringify(DEFAULT_INDENTATION)).toEqual(["# h1", "## h2"]);
});
