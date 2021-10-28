export class Parser {
    private readonly HEADING = /^(?<headingToken>#+)\s/;
    private readonly LIST_ITEM = /^(?<indentation> *)-\s/;
    private readonly INDENTED_LINE = /^(?<indentation>(?: {2})+)[^-]/;
    private root: Node = new Node(null);
    private context: Node = this.root;

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
                continue;
            }

            const indentedLineMatch = line.match(this.INDENTED_LINE);
            if (indentedLineMatch) {
                this.context.append(new Node(line));
                continue;
            }

            this.breakOutOfListContext();
            this.context.append(new Node(line));
        }
        return this.root;
    }

    private appendContextWithLevelShift(node: Node) {
        const levelsAboveCurrentContext = this.context.level - node.level;
        if (levelsAboveCurrentContext >= 0) {
            const newParentContextLevel = levelsAboveCurrentContext + 1;
            this.moveContextUp(newParentContextLevel);
        }
        this.appendContext(node);
    }

    private appendContext(node: Node) {
        this.context.append(node);
        this.context = node;
    }

    private breakOutOfListContext() {
        while (this.context instanceof ListNode) {
            this.moveContextUp(1);
        }
    }

    private moveContextUp(levels: number) {
        for (let i = 0; i < levels; i++) {
            this.context = this.context.parent;
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
