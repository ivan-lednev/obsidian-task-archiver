import { Block } from "../model/Block";
import { ListBlock } from "../model/ListBlock";
import { TextBlock } from "../model/TextBlock";
import { RootBlock } from "../model/RootBlock";
import { TreeBuilder } from "./TreeBuilder";
import { ParserSettings } from "./ParserSettings";
import { settings } from "cluster";

export class BlockParser {
    private readonly LIST_ITEM =
        /^(?<indentation>(?: {2}|\t)*)(?<listMarker>[-*]|\d+\.\s)/;
    private readonly INDENTED_LINE = /^(?<indentation>(?: {2}|\t)+)[^-]/;

    constructor(private readonly settings: ParserSettings) {}

    parse(lines: string[]): Block {
        const flatBlocks = this.parseFlatBlocks(lines);
        const root = new RootBlock(null, 0);
        new TreeBuilder().buildTree(
            root,
            flatBlocks
        );
        return root;
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
                const indentationLength = listMatch.groups.indentation.length;
                const lineWithoutIndentation = line.substring(indentationLength);
                const block = new ListBlock(
                    lineWithoutIndentation,
                    level,
                    this.settings
                );
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
