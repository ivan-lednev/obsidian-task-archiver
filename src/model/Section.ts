import { flatMap } from "lodash";

import { Block } from "./Block";
import { MarkdownNode } from "./MarkdownNode";
import { TreeFilter } from "./TreeFilter";

import { BlockExtractor } from "../features/Archiver";

export class Section extends MarkdownNode<Section> {
    children: Section[];
    tokenLevel: number;

    constructor(text: string, tokenLevel: number, public blockContent: Block) {
        super(text);
        this.tokenLevel = tokenLevel;
    }

    extractBlocksRecursively(filter: TreeFilter, extractor: BlockExtractor): Block[] {
        const extracted = extractor(this.blockContent, filter.blockFilter);

        for (const section of this.children) {
            if (!filter.sectionFilter || filter.sectionFilter(section)) {
                extracted.push(...section.extractBlocksRecursively(filter, extractor));
            }
        }
        return extracted;
    }

    recalculateTokenLevels(newLevel: number = this.tokenLevel) {
        this.tokenLevel = newLevel;
        for (const child of this.children) {
            child.recalculateTokenLevels(newLevel + 1);
        }
    }

    stringify(indentation: string): string[] {
        const lines = [];

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
