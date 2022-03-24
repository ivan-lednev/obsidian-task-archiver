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

    stringify(indentation: string): string[] {
        return [this.text];
    }
}
