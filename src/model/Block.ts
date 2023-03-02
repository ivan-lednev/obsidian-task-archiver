import { MarkdownNode } from "./MarkdownNode";
import { Section } from "./Section";

export class Block extends MarkdownNode<Block> {
    parentSection: Section;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    stringify(indentation: string): string[] {
        return [this.text];
    }
}
