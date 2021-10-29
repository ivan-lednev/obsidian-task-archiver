export class Parser {
    private readonly HEADING = /^(?<headingToken>#+)\s/;
    private root: Node = new Node(null);
    private blockContext: Node = this.root;

    parse(lines: string[]) {
        let linesInSection: string[] = [];
        for (const line of lines) {
            const headingMatch = line.match(this.HEADING);
            if (headingMatch) {
                this.blockContext.blocks = new BlockParser().parse(
                    linesInSection
                );
                linesInSection = [];

                const newHeadingLevel = headingMatch.groups.headingToken.length;
                const node = new Node(line, newHeadingLevel);

                const levelsUpTheNodeChain =
                    this.blockContext.level - node.level;
                if (levelsUpTheNodeChain >= 0) {
                    const insertionPointLevel = levelsUpTheNodeChain + 1;
                    // todo: this will also break if the user skips headings (h1 => h3)
                    this.moveContextUpTheNodeChain(insertionPointLevel);
                }
                this.blockContext.append(node);
                this.blockContext = node;
            } else {
                linesInSection.push(line);
            }
        }
        // todo: duplication
        this.blockContext.blocks = new BlockParser().parse(linesInSection);
        return this.root;
    }

    private moveContextUpTheNodeChain(levels: number) {
        for (let i = 0; i < levels; i++) {
            this.blockContext = this.blockContext.parent;
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

            // if (this.blockContext instanceof ListNode) {
            //     const levelsUpTheNodeChain =
            //         this.blockContext.level - block.level;
            //     if (levelsUpTheNodeChain >= 0) {
            //         const insertionPointLevel = levelsUpTheNodeChain + 1;
            //         this.moveContextUpTheNodeChain(insertionPointLevel);
            //     }
            // }
            //     this.blockContext.append(block);
            //     this.blockContext = block;

            //     continue;
            // }

            // const indentedLineMatch = line.match(this.INDENTED_LINE);
            // if (indentedLineMatch) {
            //     this.blockContext.append(new Node(line));
            //     continue;
            // }

            // this.blockContext.append(new Node(line));
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

class Node {
    children: Node[] = [];
    blocks: Block[] = [];
    parent: Node;
    textContent: string;
    level: number = 0;

    constructor(textContent: string, level?: number) {
        this.textContent = textContent;
        this.level = level;
    }

    append(node: Node) {
        node.parent = this;
        this.children.push(node);
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

class ListNode extends Node {}
