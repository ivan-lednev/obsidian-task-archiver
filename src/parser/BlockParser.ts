import { Block } from "../model/Block";
import { ListBlock } from "../model/ListBlock";
import { TextBlock } from "../model/TextBlock";
import { RootBlock } from "../model/RootBlock";
import { FlatNode, TreeBuilder } from "./TreeBuilder";
import { IndentationSettings } from "../archiver/IndentationSettings";

export class BlockParser {
    private readonly LIST_ITEM =
        /^(?<indentation>(?: {2}|\t)*)(?<listMarker>[-*]|\d+\.\s)/;
    private readonly INDENTED_LINE = /^(?<indentation>(?: {2}|\t)+)[^-]/;

    constructor(private readonly settings: IndentationSettings) {}

    parse(lines: string[]): Block {
        const flatBlocks = this.parseFlatBlocks(lines);
        // TODO: remove the need for wrapper in root
        const root = {
            markdownNode: new RootBlock(),
            level: 0,
            isContext: true,
        };
        new TreeBuilder().buildTree(root, flatBlocks);
        return root.markdownNode;
    }

    private parseFlatBlocks(lines: string[]) {
        const flatBlocks: FlatNode<Block>[] = [];
        for (const line of lines) {
            const listMatch = line.match(this.LIST_ITEM);
            const indentedLineMatch = line.match(this.INDENTED_LINE);

            if (listMatch) {
                // TODO: duplication
                const level = this.getLineLevelByIndentation(
                    listMatch.groups.indentation
                );
                const indentationLength = listMatch.groups.indentation.length;
                const lineWithoutIndentation = line.substring(indentationLength);
                flatBlocks.push({
                    markdownNode: new ListBlock(lineWithoutIndentation),
                    level: level,
                    isContext: true,
                });
            } else if (indentedLineMatch) {
                const level = this.getLineLevelByIndentation(
                    indentedLineMatch.groups.indentation
                );
                const indentationLength = indentedLineMatch.groups.indentation.length;
                const lineWithoutIndentation = line.substring(indentationLength);
                flatBlocks.push({
                    markdownNode: new TextBlock(lineWithoutIndentation),
                    level: level,
                    isContext: false,
                });
            } else {
                flatBlocks.push({
                    markdownNode: new TextBlock(line),
                    level: 1,
                    isContext: false,
                });
            }
        }
        return flatBlocks;
    }

    private getLineLevelByIndentation(indentation: string) {
        // TODO: kludge for null; this needs to be 1 only because the root block is 0, but this way this knowledge is implicit
        let levelsOfIndentation = 1;
        if (this.settings.useTab) {
            return levelsOfIndentation + indentation.length;
        }
        return (
            levelsOfIndentation + Math.ceil(indentation.length / this.settings.tabSize)
        );
    }
}
