import { MarkdownNode } from "./MarkdownNode";

export type BlockType = "text" | "list" | "root";

export class Block extends MarkdownNode {
    children: Block[] = [];
    parent: Block | null;
    type: BlockType;

    constructor(text: string, level: number, type: BlockType) {
        super(text, level);
        this.type = type;
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
        // TODO: this should not handle the root block
        if (this.text !== null) {
            lines.push(this.text);
        }
        for (const block of this.children) {
            lines.push(...block.stringify());
        }
        return lines;
    }
}
