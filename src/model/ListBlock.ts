import { Block } from "./Block";

export class ListBlock extends Block {
    stringify(indentation: string): string[] {
        const lines = super.stringify(indentation);
        for (const block of this.children) {
            if (block instanceof ListBlock) {
                lines.push(...block.stringify(indentation).map((b) => indentation + b));
            } else {
                const extraIndentationForChildTextBlocks = "  ";
                lines.push(
                    ...block
                        .stringify(indentation)
                        .map((b) => extraIndentationForChildTextBlocks + b)
                );
            }
        }
        return lines;
    }
}
