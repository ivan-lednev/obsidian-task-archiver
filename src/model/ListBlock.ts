import { Block } from "./Block";
import { ParserSettings } from "../parser/ParserSettings";

export class ListBlock extends Block {
    constructor(
        text: string,
        private readonly settings: ParserSettings
    ) {
        super(text);
    }

    private indentFor(levels: number) {
        const oneLevelOfIndentation = this.settings.useTab
            ? "\t"
            : " ".repeat(this.settings.tabSize);
        return oneLevelOfIndentation.repeat(levels);
    }

    stringify(indentationLevel?: number): string[] {
        if (indentationLevel === undefined) {
            indentationLevel = 0;
        }
        const lines = [];
        lines.push(this.indentFor(indentationLevel) + this.text);
        for (const block of this.children) {
            if (block instanceof ListBlock) {
                const childIndentationLevel = indentationLevel + 1
                lines.push(...block.stringify(childIndentationLevel));
            } else {
                lines.push(...block.stringify());
            }
        }
        return lines;
    }
}
