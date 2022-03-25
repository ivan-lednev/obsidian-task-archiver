import { Block } from "../model/Block";
import { ListBlock } from "../model/ListBlock";
import { TextBlock } from "../model/TextBlock";
import { RootBlock } from "../model/RootBlock";
import { TreeBuilder } from "./TreeBuilder";
import { IndentationSettings } from "../archiver/IndentationSettings";

export class BlockParser {
    private readonly LIST_MARKER = /^[-*]|\d+\.\s/;
    private readonly INDENTATION = /^(?: {2}|\t)*/;

    constructor(private readonly settings: IndentationSettings) {}

    parse(lines: string[]): Block {
        const flatBlocks = lines.map((line) => this.parseFlatBlock(line));

        // TODO: remove the need for wrapper in root?
        const rootBlock = new RootBlock();
        const rootFlatBlock = {
            markdownNode: rootBlock,
            level: 0,
        };

        new TreeBuilder().buildTree(rootFlatBlock, flatBlocks);
        return rootBlock;
    }

    private parseFlatBlock(line: string) {
        const [indentation, text] = this.splitOnIndentation(line);
        const level = this.getIndentationLevel(indentation);
        const markdownNode = text.match(this.LIST_MARKER)
            ? new ListBlock(text)
            : new TextBlock(text);
        return {
            level,
            markdownNode,
        };
    }

    private splitOnIndentation(line: string) {
        const indentationMatch = line.match(this.INDENTATION);
        const indentation = indentationMatch[0];
        const text = line.substring(indentation.length);
        return [indentation, text];
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
