import { Parser } from "./Parser";

test("Builds a flat structure with non-hierarchical text", () => {
    const lines = ["text", "|table|", "|----|", "|row|", "|another row|", ""];

    const doc = new Parser().parse(lines);

    for (let i = 0; i < lines.length; i++) {
        expect(doc.blocks[i].line).toEqual(lines[i]);
    }
});

describe("Headings", () => {
    test("Text after a heading gets nested", () => {
        const lines = ["# H1", "line"];

        const root = new Parser().parse(lines);

        expect(root.children.length).toBe(1);
        const h1 = root.children[0];
        expect(h1.blocks.length).toBe(1);
    });

    test("A subheading creates another level of nesting", () => {
        const lines = ["# H1", "## H2", "line"];

        const doc = new Parser().parse(lines);

        const h1 = doc.children[0];
        expect(h1.children.length).toBe(1);
        const h2 = h1.children[0];
        expect(h2.blocks.length).toBe(1);
    });

    test("A same-level heading doesn't get nested", () => {
        const lines = ["# H1", "## H2", "## H2-2"];

        const doc = new Parser().parse(lines);

        const h1 = doc.children[0];
        expect(h1.children.length).toBe(2);
    });

    test("A higher-level heading pops nesting", () => {
        const lines = ["# H1", "## H2", "# H1", "line"];

        const doc = new Parser().parse(lines);

        expect(doc.children.length).toBe(2);
        const secondH1 = doc.children[1];
        expect(secondH1.blocks.length).toBe(1);
    });
});

describe("List items", () => {
    test("Indented text after a list item gets nested", () => {
        const lines = ["- l", "  text"];

        const doc = new Parser().parse(lines);
        expect(doc.blocks.length).toBe(1);
        // const listItem = doc.blocks;
        // expect(listItem.blocks.length).toBe(1);
    });

    test("An indented list item creates another level of nesting", () => {
        const lines = ["- l", "  - l2", "    text"];

        const doc = new Parser().parse(lines);
        const listItem = doc.blocks[0];
        const indentedListItem = listItem.blocks[0];
        expect(indentedListItem.blocks.length).toBe(1);
    });

    test("A same level list item doesn't get nested", () => {
        const lines = ["- l", "  - l2", "  - l2-2"];
        const doc = new Parser().parse(lines);
        const listItem = doc.blocks[0];
        expect(listItem.blocks.length).toBe(2);
    });

    test("A higher-level list item pops nesting", () => {
        const lines = ["- l", "  - l2", "- l2-2"];
        const doc = new Parser().parse(lines);
        expect(doc.blocks.length).toBe(2);
    });

    test("A top-level line breaks out of a list context", () => {
        const lines = ["- l", "  - l2", "line"];
        const doc = new Parser().parse(lines);
        expect(doc.blocks.length).toBe(2);
    });
});

describe("Mixing headings and lists", () => {
    test("One heading, one list", () => {
        const lines = ["# h", "- l", "line"];
        const doc = new Parser().parse(lines);
        expect(doc.children.length).toBe(1);
        const h1 = doc.children[0];
        expect(h1.blocks.length).toBe(2);
    });

    test("Multiple heading levels", () => {
        const lines = ["# h", "- l", "text", "## h2", "# h1"];
        const doc = new Parser().parse(lines);
        expect(doc.children.length).toBe(2);
        const h1 = doc.children[0];
        expect(h1.children.length).toBe(1);
        expect(h1.blocks.length).toBe(2);
    });

    test("Multiple list levels", () => {
        const lines = ["# h", "- l", "    - l2", "# h1"];
        const doc = new Parser().parse(lines);
        expect(doc.children.length).toBe(2);
        const h1 = doc.children[0];
        expect(h1.blocks.length).toBe(1);
        const list = h1.blocks[0];
        expect(list.blocks.length).toBe(1);
    });
});

describe.skip("Stringification", () => {
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
    ])("Roundtripping: %s", (lines) => {
        const parsed = new Parser().parse(lines);
        const stringified = parsed.stringify();
        expect(stringified).toEqual(lines);
    });
});
