import { Block } from "../model/Block";
import { ListBlock } from "../model/ListBlock";
import { TextBlock } from "../model/TextBlock";
import { RootBlock } from "../model/RootBlock";
import { FlatNode, TreeBuilder } from "./TreeBuilder";
import { IndentationSettings } from "../archiver/IndentationSettings";

export class BlockParser {
    private readonly LIST_MARKER = /^[-*]|\d+\.\s/;
    private readonly INDENTATION = /^(?: {2}|\t)+/;

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
            const indentationMatch = line.match(this.INDENTATION);

            let { indentationLevel, lineWithoutIndentation } =
                this.getIndentationFromLine(line);

            const listMarker = lineWithoutIndentation.match(this.LIST_MARKER);
            if (listMarker) {
                flatBlocks.push({
                    markdownNode: new ListBlock(lineWithoutIndentation),
                    level: indentationLevel,
                    isContext: true,
                });
            } else {
                flatBlocks.push({
                    markdownNode: new TextBlock(lineWithoutIndentation),
                    level: indentationLevel,
                    isContext: false,
                });
            }
        }
        return flatBlocks;
    }

    private getIndentationFromLine(line: string) {
        const indentationMatch = line.match(this.INDENTATION);
        if (indentationMatch) {
            const indentationChars = indentationMatch[0];
            return {
                indentationLevel: this.getIndentationLevel(indentationChars),
                lineWithoutIndentation: line.substring(indentationChars.length),
            };
        }
        return { indentationLevel: 1, lineWithoutIndentation: line };
    }

    private getIndentationLevel(indentation: string) {
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
