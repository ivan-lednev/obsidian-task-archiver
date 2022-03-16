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
        let contextBlock = root;

        function moveContextUpIfBlockIsHigher(block: ListBlock) {
            const indentationDifference = contextBlock.level - block.level;
            if (indentationDifference >= 0) {
                const newContextBlockLevel = indentationDifference + 1;
                contextBlock = contextBlock.getNthAncestor(newContextBlockLevel);
            }
        }

        for (const block of flatBlocks) {
            // TODO: the logic for lists is idential to the logic for sections
            if (block instanceof ListBlock) {
                moveContextUpIfBlockIsHigher(block);
                contextBlock.appendChild(block);
                contextBlock = block;
            } else {
                const isTopLine = block.level === 1;
                if (isTopLine) {
                    contextBlock = root;
                }
                contextBlock.appendChild(block);
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
