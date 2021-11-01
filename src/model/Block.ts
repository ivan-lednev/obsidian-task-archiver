export type BlockType = "text" | "list" | "root";

export class Block {
    blocks: Block[] = [];
    text: string;
    level: number;
    parent: Block | null;
    type: BlockType;

    constructor(line: string, level: number, type: BlockType) {
        this.text = line;
        this.level = level;
        this.type = type;
    }

    append(block: Block) {
        this.blocks.push(block);
        block.parent = this;
    }

    appendFirst(block: Block) {
        this.blocks.unshift(block);
        block.parent = this;
    }

    appendSibling(block: Block) {
        const indexOfThis = this.parent.blocks.findIndex((b) => b === this);
        this.parent.blocks.splice(indexOfThis + 1, 0, block);
    }

    remove(child: Block) {
        child.parent = null;
        this.blocks.splice(this.blocks.indexOf(child), 1);
    }

    removeSelf() {
        this.parent.remove(this);
    }

    findRecursively(matcher: (block: Block) => boolean): Block | null {
        if (matcher(this)) {
            return this;
        }
        for (const child of this.blocks) {
            const found = child.findRecursively(matcher);
            if (found !== null) {
                return found;
            }
        }
        return null;
    }

    stringify(): string[] {
        const lines = [];
        // TODO: this should not handle the root block
        if (this.text !== null) {
            lines.push(this.text);
        }
        for (const block of this.blocks) {
            lines.push(...block.stringify());
        }
        return lines;
    }
}
