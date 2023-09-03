import { flatMap } from "lodash";

import { Block } from "./Block";

export class ListBlock extends Block {
    stringify(indentationFromParent: string): string[] {
        const theseLines = super.stringify(indentationFromParent);

        const childLines = flatMap(this.children, (child) => {
            const stringifiedChildLines = child.stringify(indentationFromParent);

            let extraIndentationForChildren = "";

            if (child instanceof ListBlock) {
                extraIndentationForChildren = indentationFromParent;
            }

            return stringifiedChildLines.map(
                (text) => extraIndentationForChildren + text
            );
        });
        return [...theseLines, ...childLines];
    }
}
