import { MarkdownNode } from "./MarkdownNode";

export class Block extends MarkdownNode<Block> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    stringify(indentation: string): string[] {
        return [this.text];
    }
}
