import { Block } from "./Block";
import { MarkdownNode } from "./MarkdownNode";
import { TreeFilter } from "./TreeFilter";
import { flatMap, partition } from "lodash";

export class Section extends MarkdownNode<Section> {
    children: Section[];

    constructor(text: string, public blockContent: Block) {
        super(text);
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

    stringify(indentation: string): string[] {
        const lines = [];

        // TODO: kludge for null
        if (this.text) {
            lines.push(this.text);
        }

        const children = [...this.blockContent.children, ...this.children];
        return [
            ...lines,
            ...flatMap(children, (child) => child.stringify(indentation)),
        ];
    }
}
