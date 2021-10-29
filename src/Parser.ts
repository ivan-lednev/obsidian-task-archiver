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
                // todo: this will also break if the user skips headings (h1 => h3)
                for (
                    let stepsUpToParentSection = stepsUpToSection + 1;
                    stepsUpToParentSection > 0;
                    stepsUpToParentSection--
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
        const flatBlocks = this.parseFlatBlocks(lines);

        const rootContainer: Block[] = [];

        let context: Block = null;
        let contextContainer: Block[] = rootContainer;
        for (const block of flatBlocks) {
            if (block.type === "list") {
                // if (context) {
                //     const stepsUpToSection = context.level - block.level;
                //     if (stepsUpToSection >= 0) {
                //         for (
                //             let stepsUpToParentBlock = stepsUpToSection + 1;
                //             stepsUpToParentBlock > 0;
                //             stepsUpToParentBlock--
                //         ) {
                //             context = context.parent;
                //         }
                //     }
                // }
                contextContainer.push(block);

                block.parent = context;

                contextContainer = block.blocks;
                context = block;
            } else if (block.level > 0) {
                contextContainer.push(block);
            } else {
                rootContainer.push(block);
            }
        }

        return rootContainer;
    }

    private parseFlatBlocks(lines: string[]) {
        const rawBlocks: Block[] = [];
        for (const line of lines) {
            const listMatch = line.match(this.LIST_ITEM);
            if (listMatch) {
                const level = this.getLineLevel(listMatch.groups.indentation);
                const block = new Block(line, level, "list");
                rawBlocks.push(block);
                continue;
            }

            const indentedLineMatch = line.match(this.INDENTED_LINE);
            if (indentedLineMatch) {
                const level = this.getLineLevel(
                    indentedLineMatch.groups.indentation
                );
                const block = new Block(line, level, "text");
                rawBlocks.push(block);
                continue;
            }

            rawBlocks.push(new Block(line, 0, "text"));
        }
        return rawBlocks;
    }

    private getLineLevel(indentation: string) {
        return Math.floor(indentation.length / 2);
    }
}

class Block {
    blocks: Block[] = [];
    line: string;
    level: number;
    parent: Block | null;
    type: "text" | "list";

    constructor(line: string, level: number, type: "text" | "list") {
        this.line = line;
        this.level = level;
        this.type = type;
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
        if (this.children) {
            for (const child of this.children) {
                lines.push(...child.stringify());
            }
        }
        return lines;
    }
}
