import { flatMap } from "lodash";

import { Block } from "./Block";


export class ListBlock extends Block {
    private static readonly EXTRA_INDENTATION_FOR_CHILD_TEXT_BLOCKS = "  ";

    stringify(indentation: string): string[] {
        const theseLines = super.stringify(indentation);
        const childLines = flatMap(this.children, (child) => {
            const extraIndentationForChildren =
                child instanceof ListBlock
                    ? indentation
                    : ListBlock.EXTRA_INDENTATION_FOR_CHILD_TEXT_BLOCKS;
            return child
                .stringify(indentation)
                .map((text) => extraIndentationForChildren + text);
        });
        return [...theseLines, ...childLines];
    }
}