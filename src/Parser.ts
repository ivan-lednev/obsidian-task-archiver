export class Parser {
    private readonly HEADING = /^(?<headingToken>#+)\s/;
    private readonly LIST_ITEM = /^(?<indentation> *)-\s/;
    private readonly INDENTED_LINE = /^(?<indentation>(?: {2})+)[^-]/;
    private document: Node = new Node(null);
    private contextBlock: Node = this.document;
    private inListContext: boolean = false;

    parse(lines: string[]) {
        for (const line of lines) {
            const headingMatch = line.match(this.HEADING);
            if (headingMatch) {
                const newHeadingLevel = headingMatch.groups.headingToken.length;
                const node = new Node(line, newHeadingLevel);
                this.appendContextWithLevelShift(node);
                continue;
            }

            const listItemMatch = line.match(this.LIST_ITEM);
            if (listItemMatch) {
                const level = Math.floor(
                    listItemMatch.groups.indentation.length / 2
                );
                const node = new ListNode(line, level);
                this.appendContextWithLevelShift(node);

                this.inListContext = true;
                continue;
            }

            const indentedLineMatch = line.match(this.INDENTED_LINE);
            if (indentedLineMatch) {
                this.contextBlock.append(new Node(line));
                continue;
            }

            // At this point, a top-level line is the only option
            while (this.contextBlock instanceof ListNode) {
                this.moveContextUp(1);
            }
            this.inListContext = false;
            this.contextBlock.append(new Node(line));
        }
        return this.document;
    }

    private appendContextWithLevelShift(node: Node) {
        const levelsAboveCurrentContext = this.contextBlock.level - node.level;
        if (levelsAboveCurrentContext >= 0) {
            const newParentContextLevel = levelsAboveCurrentContext + 1;
            this.moveContextUp(newParentContextLevel);
        }
        this.appendContext(node);
    }

    private appendContext(node: Node) {
        this.contextBlock.append(node);
        this.contextBlock = node;
    }

    private moveContextUp(levels: number) {
        for (let i = 0; i < levels; i++) {
            this.contextBlock = this.contextBlock.parent;
        }
    }
}

class Node {
    children: Node[];
    parent: Node;
    textContent: string;
    level: number = 0;

    constructor(textContent?: string, level?: number) {
        this.textContent = textContent;
        this.level = level;
        this.children = [];
    }

    append(node: Node) {
        node.parent = this;
        this.children.push(node);
    }
}

class ListNode extends Node {}
