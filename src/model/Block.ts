import { MarkdownNode } from "./MarkdownNode";

export class Block extends MarkdownNode {
    children: Block[] = [];
    parent: Block | null;

    constructor(text: string, level: number) {
        super(text, level);
    }

    findRecursively(matcher: (node: Block) => boolean): Block | null {
        if (matcher(this)) {
            return this;
        }
        for (const child of this.children) {
            const found = child.findRecursively(matcher);
            if (found !== null) {
                return found;
            }
        }
        return null;
    }

    stringify(): string[] {
        const lines = [];
        // TODO: kludge for null
        if (this.text !== null) {
            lines.push(this.text);
        }
        for (const block of this.children) {
            lines.push(...block.stringify());
        }
        return lines;
    }
}
