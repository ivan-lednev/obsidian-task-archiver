import { IndentationSettings } from "./archiver/IndentationSettings";
import { Block } from "./model/Block";

export function buildIndentation(settings: IndentationSettings) {
    return settings.useTab ? "\t" : " ".repeat(settings.tabSize);
}

export function findBlockRecursively(
    blocks: Block[],
    matcher: (node: Block) => boolean
): Block | null {
    for (const block of blocks) {
        if (matcher(block)) {
            return block;
        }
        const found = findBlockRecursively(block.children, matcher);
        if (found !== null) {
            return found;
        }
    }
    return null;
}
