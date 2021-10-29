interface RawSection {
    heading: string;
    level: number;
    lines: string[];
}

export class Parser {
    private readonly HEADING = /^(?<headingToken>#+)\s.*$/;

    parse(lines: string[]) {
        const rawSections = this.parseRawSections(lines);

        // todo: duplication
        const rootLines = rawSections[0].lines;
        const rootBlocks = new BlockParser().parse(rootLines);
        const root = new Section(null, 0, rootBlocks);

        const rawWithoutRoot = rawSections.slice(1);
        const flatSections = this.parseBlocksInSections(rawWithoutRoot);
        this.buildSectionHierarchy(root, flatSections);

        return root;
    }

    private parseBlocksInSections(raw: RawSection[]) {
        return raw.map((s) => {
            return new Section(
                s.heading,
                s.level,
                new BlockParser().parse(s.lines)
            );
        });
    }

    private buildSectionHierarchy(root: Section, flatSections: Section[]) {
        let context = root;
        for (const section of flatSections) {
            const stepsToSection = context.level - section.level;
            if (stepsToSection >= 0) {
                // todo: this will also break if the user skips headings (h1 => h3)
                for (
                    let stepsToParentLevelIndex = stepsToSection + 1;
                    stepsToParentLevelIndex > 0;
                    stepsToParentLevelIndex--
                ) {
                    context = context.parent;
                }
            }

            context.append(section);
            context = section;
        }
    }

    private parseRawSections(lines: string[]) {
        const sections: RawSection[] = [
            { heading: "root sentinel", level: 0, lines: [] },
        ];
        for (const line of lines) {
            const match = line.match(this.HEADING);
            if (match) {
                sections.push({
                    heading: match[0],
                    level: match.groups.headingToken.length,
                    lines: [],
                });
            } else {
                const lastSection = sections[sections.length - 1];
                lastSection.lines.push(line);
            }
        }

        return sections;
    }
}

class BlockParser {
    private readonly LIST_ITEM = /^(?<indentation> *)-\s/;
    private readonly INDENTED_LINE = /^(?<indentation>(?: {2})+)[^-]/;

    parse(lines: string[]): Block[] {
        const blocks = [];
        let context: Block;

        for (const line of lines) {
            const listItemMatch = line.match(this.LIST_ITEM);
            if (listItemMatch) {
                const level = Math.floor(
                    listItemMatch.groups.indentation.length / 2
                );
                const block = new Block(line, level);
                if (context) {
                    context.children.push(block);
                }
                context = block;
            }

            blocks.push(new Block(line, 1));
        }
        return blocks;
    }
}

class Block {
    children: Block[] = [];
    line: string;
    level: number;
    constructor(line: string, level: number) {
        this.line = line;
        this.level = level;
    }
}

class Section {
    children: Section[] = [];
    blocks: Block[] = [];
    parent: Section;
    textContent: string;
    level: number = 0;

    constructor(textContent: string, level: number, blocks: Block[]) {
        this.textContent = textContent;
        this.level = level;
        this.blocks = blocks;
    }

    append(section: Section) {
        section.parent = this;
        this.children.push(section);
    }

    stringify(): string[] {
        const lines = [];
        if (this.textContent) {
            lines.push(this.textContent);
        }
        if (this.children) {
            for (const child of this.children) {
                lines.push(...child.stringify());
            }
        }
        return lines;
    }
}
