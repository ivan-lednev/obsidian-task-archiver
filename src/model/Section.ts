import { flatMap } from "lodash";

import { Block } from "./Block";
import { MarkdownNode } from "./MarkdownNode";

export class Section extends MarkdownNode<Section> {
    children: Section[];
    tokenLevel: number;
    frontMatter?: string[];

    constructor(text: string, tokenLevel: number, public blockContent: Block) {
        super(text);
        this.tokenLevel = tokenLevel;
    }

    recalculateTokenLevels(newLevel: number = this.tokenLevel) {
        this.tokenLevel = newLevel;
        for (const child of this.children) {
            child.recalculateTokenLevels(newLevel + 1);
        }
    }

    stringify(indentation: string): string[] {
        const lines = [];

        if (this.frontMatter) {
            lines.push(...this.frontMatter);
        }

        if (this.text) {
            lines.push("#".repeat(this.tokenLevel) + this.text);
        }

        const children = [...this.blockContent.children, ...this.children];
        return [
            ...lines,
            ...flatMap(children, (child) => child.stringify(indentation)),
        ];
    }
}
