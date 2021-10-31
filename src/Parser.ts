interface ParserSettings {
    useTab: boolean;
    tabSize: number;
}

export class Parser {
    private readonly HEADING = /^(?<headingToken>#+)\s.*$/;
    private readonly settings: ParserSettings;

    constructor(settings: ParserSettings) {
        this.settings = settings;
    }

    parse(lines: string[]) {
        const rawSections = this.parseRawSections(lines);
        const flatSections = this.parseBlocksInSections(rawSections);

        const [root, children] = [flatSections[0], flatSections.slice(1)];
        this.buildTree(root, children);

        return root;
    }

    private parseRawSections(lines: string[]) {
        const sections: RawSection[] = [{ text: null, level: 0, lines: [] }];

        for (const line of lines) {
            const match = line.match(this.HEADING);
            if (match) {
                sections.push({
                    text: match[0],
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

    private parseBlocksInSections(raw: RawSection[]) {
        return raw.map((s) => {
            return new Section(
                s.text,
                s.level,
                new BlockParser(this.settings).parse(s.lines)
            );
        });
    }

    private buildTree(root: Section, flatSections: Section[]) {
        let context = root;
        for (const section of flatSections) {
            const stepsUpToSection = context.level - section.level;
            if (stepsUpToSection >= 0) {
                const stepsUpToParent = stepsUpToSection + 1;
                context = this.goUpInNodeChain(stepsUpToParent, context);
            }

            context.append(section);
            context = section;
        }
    }

    goUpInNodeChain(targetLevel: number, node: Section) {
        let pointer = node;

        for (let level = 0; level < targetLevel; level++) {
            pointer = pointer.parent;
        }

        return pointer;
    }
}

class BlockParser {
    private readonly LIST_ITEM =
        /^(?<indentation>(?: {2}|\t)*)(?<listMarker>[-*]|\d+\.)\s/;
    private readonly INDENTED_LINE = /^(?<indentation>(?: {2}|\t)+)[^-]/;
    private readonly settings: ParserSettings;

    constructor(settings: ParserSettings) {
        this.settings = settings;
    }

    parse(lines: string[]): Block {
        const flatBlocks = this.parseFlatBlocks(lines);

        const [root, children] = [flatBlocks[0], flatBlocks.slice(1)];
        this.buildTree(root, children);

        return root;
    }

    private buildTree(root: Block, flatBlocks: Block[]) {
        let context = root;

        for (const block of flatBlocks) {
            // TODO: the logic for lists is idential to the logic for sections
            if (block.type === "list") {
                const stepsUpToSection = context.level - block.level;

                if (stepsUpToSection >= 0) {
                    const targetLevel = stepsUpToSection + 1;
                    context = this.goUpInNodeChain(targetLevel, context);
                }

                context.append(block);
                context = block;
            } else {
                const isTopLine = block.level === 1;
                if (isTopLine) {
                    context = root;
                }
                context.append(block);
            }
        }
    }

    // TODO: copypasted. Common to blocks & sections
    goUpInNodeChain(targetLevel: number, node: Block) {
        let pointer = node;

        for (let level = 0; level < targetLevel; level++) {
            pointer = pointer.parent;
        }

        return pointer;
    }

    private parseFlatBlocks(lines: string[]) {
        const flatBlocks: Block[] = [new Block(null, 0, "root")];
        for (const line of lines) {
            const listMatch = line.match(this.LIST_ITEM);
            const indentedLineMatch = line.match(this.INDENTED_LINE);

            if (listMatch) {
                const level = this.getLineLevelByIndentation(
                    listMatch.groups.indentation
                );
                const block = new Block(line, level, "list");
                flatBlocks.push(block);
            } else if (indentedLineMatch) {
                const level = this.getLineLevelByIndentation(
                    indentedLineMatch.groups.indentation
                );
                const block = new Block(line, level, "text");
                flatBlocks.push(block);
            } else {
                flatBlocks.push(new Block(line, 1, "text"));
            }
        }
        return flatBlocks;
    }

    private getLineLevelByIndentation(indentation: string) {
        let levelsOfIndentation;
        if (this.settings.useTab) {
            levelsOfIndentation = indentation.length;
        } else {
            levelsOfIndentation = Math.floor(indentation.length / 2);
        }
        return levelsOfIndentation + 1;
    }
}

type BlockType = "text" | "list" | "root";

class Block {
    blocks: Block[] = [];
    text: string;
    level: number;
    parent: Block | null;
    type: BlockType;

    constructor(line: string, level: number, type: BlockType) {
        this.text = line;
        this.level = level;
        this.type = type;
    }

    append(block: Block) {
        this.blocks.push(block);
        block.parent = this;
    }

    remove(child: Block) {
        this.blocks.splice(this.blocks.indexOf(child), 1);
    }

    removeSelf() {
        this.parent.remove(this);
    }

    stringify(): string[] {
        const lines = [];
        lines.push(this.text);
        for (const block of this.blocks) {
            lines.push(...block.stringify());
        }
        return lines;
    }
}

interface RawSection {
    text: string;
    level: number;
    lines: string[];
}

export class Section {
    sections: Section[];
    blockContent: Block;
    parent: Section;
    text: string;
    level: number;

    constructor(textContent: string, level: number, blockContent: Block) {
        this.text = textContent;
        this.level = level;
        this.blockContent = blockContent;
        this.sections = [];
    }

    append(section: Section) {
        section.parent = this;
        this.sections.push(section);
    }

    extractBlocksRecursively(
        lineFilter: (line: string) => boolean = this.alwaysTrue,
        headingFilter: (heading: string) => boolean = this.alwaysTrue
    ): Block[] {
        const extracted = [];
        for (const block of this.blockContent.blocks) {
            if (lineFilter(block.text)) {
                extracted.push(block);
            }
        }
        for (const block of extracted) {
            block.removeSelf();
        }
        for (const section of this.sections) {
            if (headingFilter(section.text)) {
                extracted.push(
                    ...section.extractBlocksRecursively(
                        lineFilter,
                        headingFilter
                    )
                );
            }
        }
        return extracted;
    }

    private alwaysTrue() {
        return true;
    }

    stringify(): string[] {
        const lines = [];
        if (this.text) {
            lines.push(this.text);
        }
        for (const tree of [this.blockContent.blocks, this.sections]) {
            for (const child of tree) {
                lines.push(...child.stringify());
            }
        }
        return lines;
    }
}
