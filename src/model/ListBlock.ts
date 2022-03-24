import { Block } from "./Block";
import { flatMap } from "lodash";

export class ListBlock extends Block {
    stringify(indentation: string): string[] {
        const extraIndentationForChildTextBlocks = "  ";
        return [
            ...super.stringify(indentation),
            ...flatMap(this.children, (child) => {
                const extraIndentationForChildren =
                    child instanceof ListBlock
                        ? indentation
                        : extraIndentationForChildTextBlocks;
                return child
                    .stringify(indentation)
                    .map((text) => extraIndentationForChildren + text);
            }),
        ];
    }
}
