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
        };
        new TreeBuilder().buildTree(root, flatBlocks);
        return root.markdownNode;
    }

    private parseFlatBlocks(lines: string[]) {
        return lines.map((line) => {
            const { level, lineWithoutIndentation } = this.splitOnIndentation(line);
            const markdownNode = lineWithoutIndentation.match(this.LIST_MARKER)
                ? new ListBlock(lineWithoutIndentation)
                : new TextBlock(lineWithoutIndentation);
            return {
                markdownNode,
                level,
            };
        });
    }

    private splitOnIndentation(line: string) {
        const indentationMatch = line.match(this.INDENTATION);
        if (indentationMatch) {
            const indentationChars = indentationMatch[0];
            return {
                level: this.getIndentationLevel(indentationChars),
                lineWithoutIndentation: line.substring(indentationChars.length),
            };
        }
        return { level: 1, lineWithoutIndentation: line };
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
