export class Parser {
    private readonly HEADING = /^(?<headingToken>#+)\s.*$/;

    parse(lines: string[]) {
        const rawSections = this.parseRawSections(lines);
        const flatSections = this.parseBlocksInSections(rawSections);

        const [root, children] = [flatSections[0], flatSections.slice(1)];
        this.buildSectionHierarchy(root, children);

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
            const stepsUpToSection = context.level - section.level;
            if (stepsUpToSection >= 0) {
                const stepsUpToParent = stepsUpToSection + 1;
                context = this.goUpToParentInNodeChain(
                    stepsUpToParent,
                    context
                );
            }

            context.append(section);
            context = section;
        }
    }

    private goUpToParentInNodeChain(targetLevel: number, node: Section) {
        let pointer = node;

        for (let level = 0; level < targetLevel; level++) {
            pointer = pointer.parent;
        }

        return pointer;
    }

    private parseRawSections(lines: string[]) {
        const sections: RawSection[] = [{ heading: null, level: 0, lines: [] }];

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
        const flatBlocks = this.parseFlatBlocks(lines);

        const root: Block = new Block(null, 0, "root");
        root.blocks = [];
        let context = root;

        for (const block of flatBlocks) {
            if (block.type === "list") {
                const stepsUpToSection = context.level - block.level;
                if (stepsUpToSection >= 0) {
                    const targetLevel = stepsUpToSection + 1;

                    // TODO: copypasted
                    for (let level = targetLevel; level > 0; level--) {
                        context = context.parent;
                    }
                }
                context.blocks.push(block);
                block.parent = context;
                context = block;
            } else {
                const isTopLine = block.level === 1;
                if (isTopLine) {
                    context = root;
                }
                context.blocks.push(block);
            }
        }

        return root.blocks;
    }

    private parseFlatBlocks(lines: string[]) {
        const rawBlocks: Block[] = [];
        for (const line of lines) {
            const listMatch = line.match(this.LIST_ITEM);
            const indentedLineMatch = line.match(this.INDENTED_LINE);

            if (listMatch) {
                const level = this.getLineLevel(listMatch.groups.indentation);
                const block = new Block(line, level, "list");
                rawBlocks.push(block);
            } else if (indentedLineMatch) {
                const level = this.getLineLevel(
                    indentedLineMatch.groups.indentation
                );
                const block = new Block(line, level, "text");
                rawBlocks.push(block);
            } else {
                rawBlocks.push(new Block(line, 1, "text"));
            }
        }
        return rawBlocks;
    }

    private getLineLevel(indentation: string) {
        return Math.floor(indentation.length / 2) + 1;
    }
}

type BlockType = "text" | "list" | "root";

class Block {
    blocks: Block[] = [];
    line: string;
    level: number;
    parent: Block | null;
    type: BlockType;

    constructor(line: string, level: number, type: BlockType) {
        this.line = line;
        this.level = level;
        this.type = type;
    }

    stringify(): string[] {
        const lines = [];
        lines.push(this.line);
        for (const block of this.blocks) {
            lines.push(...block.stringify());
        }
        return lines;
    }
}

interface RawSection {
    heading: string;
    level: number;
    lines: string[];
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
        if (this.blocks) {
            for (const block of this.blocks) {
                lines.push(...block.stringify());
            }
        }
        if (this.children) {
            for (const child of this.children) {
                lines.push(...child.stringify());
            }
        }
        return lines;
    }
}
