export class Parser {
    private readonly HEADING = /^(?<headingToken>#+)\s/;
    private readonly LIST_ITEM = /^(?<indentation> *)-\s/;
    private readonly INDENTED_LINE = /^(?<indentation>(?: {2})+)[^-]/;
    private root: Node = new Node(null);
    private blockContext: Node = this.root;

    parse(lines: string[]) {
        for (const line of lines) {
            const headingMatch = line.match(this.HEADING);
            if (headingMatch) {
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

                continue;
            }

            this.blockContext.blocks.push(line)

            // const listItemMatch = line.match(this.LIST_ITEM);
            // if (listItemMatch) {
            //     const level = Math.floor(
            //         listItemMatch.groups.indentation.length / 2
            //     );
            //     const node = new ListNode(line, level);

            //     if (this.blockContext instanceof ListNode) {
            //         const levelsUpTheNodeChain =
            //             this.blockContext.level - node.level;
            //         if (levelsUpTheNodeChain >= 0) {
            //             const insertionPointLevel = levelsUpTheNodeChain + 1;
            //             this.moveContextUpTheNodeChain(insertionPointLevel);
            //         }
            //     }
            //     this.blockContext.append(node);
            //     this.blockContext = node;

            //     continue;
            // }

            // const indentedLineMatch = line.match(this.INDENTED_LINE);
            // if (indentedLineMatch) {
            //     this.blockContext.append(new Node(line));
            //     continue;
            // }

            // this.breakOutOfListContext();
            // this.blockContext.append(new Node(line));
        }
        return this.root;
    }

    private breakOutOfListContext() {
        while (this.blockContext instanceof ListNode) {
            this.moveContextUpTheNodeChain(1);
        }
    }

    private moveContextUpTheNodeChain(levels: number) {
        for (let i = 0; i < levels; i++) {
            this.blockContext = this.blockContext.parent;
        }
    }
}

class Node {
    children: Node[] = [];
    blocks: string[] = [];
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
