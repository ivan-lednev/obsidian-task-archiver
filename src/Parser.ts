export class Parser {
    private readonly HEADING = /^(?<headingToken>#+)\s/;
    private root: Section = new Section(null);
    private context: Section = this.root;

    parse(lines: string[]) {
        let linesInSection: string[] = [];
        for (const line of lines) {
            const headingMatch = line.match(this.HEADING);
            if (headingMatch) {
                this.context.blocks = new BlockParser().parse(linesInSection);
                linesInSection = [];

                const newHeadingLevel = headingMatch.groups.headingToken.length;
                const section = new Section(line, newHeadingLevel);

                const levelsUpTheSectionChain =
                    this.context.level - section.level;
                if (levelsUpTheSectionChain >= 0) {
                    const insertionPointLevel = levelsUpTheSectionChain + 1;
                    // todo: this will also break if the user skips headings (h1 => h3)
                    this.moveContextUpTheSectionChain(insertionPointLevel);
                }
                this.context.append(section);
                this.context = section;
            } else {
                linesInSection.push(line);
            }
        }
        // todo: duplication
        this.context.blocks = new BlockParser().parse(linesInSection);
        return this.root;
    }

    private moveContextUpTheSectionChain(levels: number) {
        for (let i = 0; i < levels; i++) {
            this.context = this.context.parent;
        }
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

            // if (this.blockContext instanceof ListSection) {
            //     const levelsUpTheSectionChain =
            //         this.blockContext.level - block.level;
            //     if (levelsUpTheSectionChain >= 0) {
            //         const insertionPointLevel = levelsUpTheSectionChain + 1;
            //         this.moveContextUpTheSectionChain(insertionPointLevel);
            //     }
            // }
            //     this.blockContext.append(block);
            //     this.blockContext = block;

            //     continue;
            // }

            // const indentedLineMatch = line.match(this.INDENTED_LINE);
            // if (indentedLineMatch) {
            //     this.blockContext.append(new Section(line));
            //     continue;
            // }

            // this.blockContext.append(new Section(line));
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

    constructor(textContent: string, level?: number) {
        this.textContent = textContent;
        this.level = level;
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

class ListSection extends Section {}
