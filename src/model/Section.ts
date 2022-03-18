import { Block } from "./Block";
import { MarkdownNode } from "./MarkdownNode";
import { TreeFilter } from "./TreeFilter";
import { partition } from "lodash";

export class Section extends MarkdownNode<Section> {
    children: Section[];
    blockContent: Block;

    constructor(text: string, level: number, blockContent: Block) {
        super(text, level);
        this.blockContent = blockContent;
    }

    extractBlocksRecursively(filter: TreeFilter): Block[] {
        const [extracted, theRest] = partition(
            this.blockContent.children,
            filter.blockFilter
        );

        // TODO: mutation
        this.blockContent.children = theRest;

        for (const section of this.children) {
            if (!filter.sectionFilter || filter.sectionFilter(section)) {
                extracted.push(...section.extractBlocksRecursively(filter));
            }
        }
        return extracted;
    }

    stringify(): string[] {
        const lines = [];
        // TODO: kludge for null
        if (this.text) {
            lines.push(this.text);
        }
        for (const child of [...this.blockContent.children, ...this.children]) {
            lines.push(...child.stringify());
        }
        return lines;
    }
}
