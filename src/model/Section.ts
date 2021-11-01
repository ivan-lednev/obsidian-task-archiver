import { Block } from "./Block";

export class Section {
    sections: Section[];
    blockContent: Block;
    parent: Section;
    text: string;
    level: number;

    constructor(textContent: string, level: number, blockContent: Block) {
        this.text = textContent;
        this.level = level;
        this.blockContent = blockContent;
        this.sections = [];
    }

    append(section: Section) {
        section.parent = this;
        this.sections.push(section);
    }

    // TODO: replace with visitor
    extractBlocksRecursively(filter: TreeFilter): Block[] {
        const extracted = [];
        for (const block of this.blockContent.blocks) {
            if (!filter.blockFilter || filter.blockFilter(block)) {
                extracted.push(block);
            }
        }
        for (const block of extracted) {
            block.removeSelf();
        }
        for (const section of this.sections) {
            if (!filter.sectionFilter || filter.sectionFilter(section)) {
                extracted.push(...section.extractBlocksRecursively(filter));
            }
        }
        return extracted;
    }

    // TODO: duplicated Block's method
    findRecursively(matcher: (section: Section) => boolean): Section | null {
        if (matcher(this)) {
            return this;
        }
        for (const child of this.sections) {
            const found = child.findRecursively(matcher);
            if (found !== null) {
                return found;
            }
        }
        return null;
    }

    stringify(): string[] {
        const lines = [];
        if (this.text) {
            lines.push(this.text);
        }
        for (const tree of [this.blockContent.blocks, this.sections]) {
            for (const child of tree) {
                lines.push(...child.stringify());
            }
        }
        return lines;
    }
}

export interface TreeFilter {
    sectionFilter?(section: Section): boolean;
    blockFilter?(block: Block): boolean;
}
