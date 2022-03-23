import { MarkdownNode } from "./MarkdownNode";

export class Block extends MarkdownNode<Block> {
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

    stringify(indentationLevel: number = 0): string[] {
        const lines = [];

        // TODO: kludge for null
        if (this.text !== null) {
            lines.push(this.text);
        }

        for (const block of this.children) {
            lines.push(...block.stringify(indentationLevel));
        }
        return lines;
    }
}
