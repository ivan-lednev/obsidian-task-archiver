import { Block } from "./Block";
import { MarkdownNode } from "./MarkdownNode";
import { TreeFilter } from "./TreeFilter";

export class Section extends MarkdownNode {
    children: Section[];
    blockContent: Block;
    parent: Section;

    constructor(text: string, level: number, blockContent: Block) {
        super(text, level);
        this.blockContent = blockContent;
    }

    extractBlocksRecursively(filter: TreeFilter): Block[] {
        const extracted = [];
        for (const block of this.blockContent.children) {
            if (!filter.blockFilter || filter.blockFilter(block)) {
                extracted.push(block);
            }
        }
        for (const block of extracted) {
            block.removeSelf();
        }
        for (const section of this.children) {
            if (!filter.sectionFilter || filter.sectionFilter(section)) {
                extracted.push(...section.extractBlocksRecursively(filter));
            }
        }
        return extracted;
    }

    stringify(): string[] {
        const lines = [];
        // TODO: another null check
        if (this.text) {
            lines.push(this.text);
        }
        for (const tree of [this.blockContent.children, this.children]) {
            for (const child of tree) {
                lines.push(...child.stringify());
            }
        }
        return lines;
    }
}

