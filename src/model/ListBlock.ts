import { flatMap } from "lodash";

import { Block } from "./Block";

export class ListBlock extends Block {
    private static readonly EXTRA_INDENTATION_FOR_CHILD_TEXT_BLOCKS = "  ";

    stringify(indentationFromParent: string): string[] {
        const theseLines = super.stringify(indentationFromParent);

        const childLines = flatMap(this.children, (child) => {
            const stringifiedChildLines = child.stringify(indentationFromParent);

            let extraIndentationForChildren: string;

            if (child instanceof ListBlock) {
                extraIndentationForChildren = indentationFromParent;
            } else {
                extraIndentationForChildren =
                    ListBlock.EXTRA_INDENTATION_FOR_CHILD_TEXT_BLOCKS;
            }

            return stringifiedChildLines.map(
                (text) => extraIndentationForChildren + text
            );
        });
        return [...theseLines, ...childLines];
    }
}
