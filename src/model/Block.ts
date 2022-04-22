import { MarkdownNode } from "./MarkdownNode";

export class Block extends MarkdownNode<Block> {
    stringify(indentation: string): string[] {
        return [this.text];
    }
}