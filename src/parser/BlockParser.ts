import { Block } from "../model/Block";
import { ListBlock } from "../model/ListBlock";
import { TextBlock } from "../model/TextBlock";
import { RootBlock } from "../model/RootBlock";
import { FlatNode, TreeBuilder } from "./TreeBuilder";
import { ParserSettings } from "./ParserSettings";

export class BlockParser {
    private readonly LIST_ITEM =
        /^(?<indentation>(?: {2}|\t)*)(?<listMarker>[-*]|\d+\.\s)/;
    private readonly INDENTED_LINE = /^(?<indentation>(?: {2}|\t)+)[^-]/;

    constructor(private readonly settings: ParserSettings) {}

    parse(lines: string[]): Block {
        const flatBlocks = this.parseFlatBlocks(lines);
        // TODO: remove the need for wrapper in root
        const root = {
            markdownNode: new RootBlock(null),
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
                const level = this.getLineLevelByIndentation(
                    listMatch.groups.indentation
                );
                const indentationLength = listMatch.groups.indentation.length;
                const lineWithoutIndentation = line.substring(indentationLength);
                flatBlocks.push({
                    markdownNode: new ListBlock(lineWithoutIndentation, this.settings),
                    level: level,
                    isContext: true,
                });
            } else if (indentedLineMatch) {
                const level = this.getLineLevelByIndentation(
                    indentedLineMatch.groups.indentation
                );
                flatBlocks.push({
                    markdownNode: new TextBlock(line),
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
