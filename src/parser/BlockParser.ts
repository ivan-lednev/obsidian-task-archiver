import { Block } from "../model/Block";
import { ListBlock } from "../model/ListBlock";
import { TextBlock } from "../model/TextBlock";
import { RootBlock } from "../model/RootBlock";
import { TreeBuilder } from "./TreeBuilder";
import { IndentationSettings } from "../archiver/IndentationSettings";
import { INDENTATION_PATTERN, LIST_MARKER_PATTERN } from "../Patterns";

export class BlockParser {
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

    getIndentationLevel(line: string) {
        // TODO: this needs to be 1 only because the root block is 0, but this way this knowledge is implicit
        const [indentation] = this.splitOnIndentation(line);
        let levelsOfIndentation = 1;
        if (this.settings.useTab) {
            return levelsOfIndentation + indentation.length;
        }
        return (
            levelsOfIndentation + Math.ceil(indentation.length / this.settings.tabSize)
        );
    }

    private parseFlatBlock(line: string) {
        const [, text] = this.splitOnIndentation(line);
        const level = this.getIndentationLevel(line);
        const markdownNode = text.match(LIST_MARKER_PATTERN)
            ? new ListBlock(text)
            : new TextBlock(text);
        return {
            level,
            markdownNode,
        };
    }

    // TODO
    private splitOnIndentation(line: string) {
        const indentationMatch = line.match(INDENTATION_PATTERN);
        const indentation = indentationMatch[0];
        const text = line.substring(indentation.length);
        return [indentation, text];
    }
}
