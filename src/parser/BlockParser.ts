import { ParserSettings } from "./SectionParser";
import { Block } from "../model/Block";
import { MarkdownNode } from "src/model/MarkdownNode";
import { ListBlock } from "../model/ListBlock";
import { TextBlock } from "../model/TextBlock";
import { RootBlock } from "../model/RootBlock";

export class BlockParser {
    private readonly LIST_ITEM =
        /^(?<indentation>(?: {2}|\t)*)(?<listMarker>[-*]|\d+\.)\s/;
    private readonly INDENTED_LINE = /^(?<indentation>(?: {2}|\t)+)[^-]/;

    constructor(private readonly settings: ParserSettings) {}

    parse(lines: string[]): Block {
        const flatBlocks = this.parseFlatBlocks(lines);
        const root = new RootBlock(null, 0);
        BlockParser.buildTree(root, flatBlocks);
        return root;
    }

    private static buildTree(root: MarkdownNode, flatBlocks: Block[]) {
        // TODO: duplicated
        let contextStack = [root];
        for (const block of flatBlocks) {
            if (block instanceof ListBlock) {
                const stepsToGoUp = contextStack.length - block.level;
                if (stepsToGoUp >= 0) {
                    for (let i = 0; i < stepsToGoUp; i++) {
                        try {
                            contextStack.pop();
                        } catch {
                            throw new Error(
                                "No more context levels to pop. Looks like the user jumped multiple levels of indentation"
                            );
                        }
                    }
                }
                contextStack[contextStack.length - 1].appendChild(block);
                contextStack.push(block);
            } else {
                const isTopLine = block.level === 1;
                if (isTopLine) {
                    contextStack = [root];
                }
                contextStack[contextStack.length - 1].appendChild(block);
            }
        }
    }

    private parseFlatBlocks(lines: string[]) {
        const flatBlocks: Block[] = [];
        for (const line of lines) {
            const listMatch = line.match(this.LIST_ITEM);
            const indentedLineMatch = line.match(this.INDENTED_LINE);

            if (listMatch) {
                const level = this.getLineLevelByIndentation(
                    listMatch.groups.indentation
                );
                const block = new ListBlock(line, level);
                flatBlocks.push(block);
            } else if (indentedLineMatch) {
                const level = this.getLineLevelByIndentation(
                    indentedLineMatch.groups.indentation
                );
                const block = new TextBlock(line, level);
                flatBlocks.push(block);
            } else {
                flatBlocks.push(new TextBlock(line, 1));
            }
        }
        return flatBlocks;
    }

    private getLineLevelByIndentation(indentation: string) {
        let levelsOfIndentation;
        if (this.settings.useTab) {
            levelsOfIndentation = indentation.length;
        } else {
            levelsOfIndentation = Math.ceil(indentation.length / this.settings.tabSize);
        }
        // TODO: kludge for null
        return levelsOfIndentation + 1;
    }
}
