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
                new BlockParser(this.settings).parse(s.lines) // TODO: this doesn't have to know anything about block parser
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

    private goUpInNodeChain(targetLevel: number, node: Section) {
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

    parse(lines: string[]): Block[] {
        const flatBlocks = this.parseFlatBlocks(lines);
        // TODO: dummy block as a root, should be something simpler

        const root: Block = new Block(null, 0, "root");
        this.buildTree(root, flatBlocks);

        return root.blocks;
    }

    private buildTree(root: Block, flatBlocks: Block[]) {
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
                // TODO: too much detail, wrap into a method
                context.blocks.push(block);
                block.parent = context;
                context = block;
            } else {
                const isTopLine = block.level === 1;
                if (isTopLine) {
                    context = root;
                    block.parent = context;
                }
                // TODO: duplication?
                context.blocks.push(block);
            }
        }
    }

    private parseFlatBlocks(lines: string[]) {
        const flatBlocks: Block[] = [];
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

interface TextNode {
    children: TextNode[];
    text: string;
    level: number;
    parent: TextNode | null;
    stringify(): string[];
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
    blocks: Block[];
    parent: Section;
    text: string;
    level: number;

    constructor(textContent: string, level: number, blocks: Block[]) {
        this.text = textContent;
        this.level = level;
        this.blocks = blocks;
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
        // I'm mutating the array while traversing it!
        // todo: this is lame!
        for (const block of this.blocks.slice()) {
            if (lineFilter(block.text)) {
                // TODO: no need to stringify here
                extracted.push(block);
                block.removeSelf();
            }
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
        for (const tree of [this.blocks, this.sections]) {
            for (const child of tree) {
                lines.push(...child.stringify())
            }
        }
        return lines;
    }
}
