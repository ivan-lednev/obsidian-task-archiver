import { Block } from "./Block";
import { IndentationSettings } from "../parser/ParserSettings";

export class ListBlock extends Block {
    private readonly indentation: string;

    constructor(text: string, private readonly settings: IndentationSettings) {
        super(text);
        // TODO: push indentation out of this class
        this.indentation = this.settings.useTab
            ? "\t"
            : " ".repeat(this.settings.tabSize);
    }

    stringify(): string[] {
        const lines = super.stringify();
        for (const block of this.children) {
            if (block instanceof ListBlock) {
                lines.push(...block.stringify().map((b) => this.indentation + b));
            } else {
                const extraIndentationForChildTextBlocks = "  ";
                lines.push(
                    ...block
                        .stringify()
                        .map((b) => extraIndentationForChildTextBlocks + b)
                );
            }
        }
        return lines;
    }
}
