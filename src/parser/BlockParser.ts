import { ParserSettings } from "./SectionParser";
import { Block } from "../model/Block";
import { MarkdownNode } from "src/model/MarkdownNode";

export class BlockParser {
    private readonly LIST_ITEM =
        /^(?<indentation>(?: {2}|\t)*)(?<listMarker>[-*]|\d+\.)\s/;
    private readonly INDENTED_LINE = /^(?<indentation>(?: {2}|\t)+)[^-]/;

    constructor(private readonly settings: ParserSettings) {}

    parse(lines: string[]): Block {
        const flatBlocks = this.parseFlatBlocks(lines);

        const [root, children] = [flatBlocks[0], flatBlocks.slice(1)];
        BlockParser.buildTree(root, children);

        return root;
    }

    private static buildTree(root: MarkdownNode, flatBlocks: Block[]) {
        let context = root;

        for (const block of flatBlocks) {
            // TODO: the logic for lists is idential to the logic for sections
            if (block.type === "list") {
                const stepsUpToSection = context.level - block.level;

                if (stepsUpToSection >= 0) {
                    const targetLevel = stepsUpToSection + 1;
                    context = context.getNthAncestor(targetLevel);
                }

                context.appendChild(block);
                context = block;
            } else {
                const isTopLine = block.level === 1;
                if (isTopLine) {
                    context = root;
                }
                context.appendChild(block);
            }
        }
    }

    private parseFlatBlocks(lines: string[]) {
        const flatBlocks: Block[] = [new Block(null, 0, "root")];
        for (const line of lines) {
            const listMatch = line.match(this.LIST_ITEM);
            const indentedLineMatch = line.match(this.INDENTED_LINE);

            if (listMatch) {
                const level = this.getLineLevelByIndentation(
                    listMatch.groups.indentation
                );
                const block = new Block(line, level, "list");
                flatBlocks.push(block);
            } else if (indentedLineMatch) {
                const level = this.getLineLevelByIndentation(
                    indentedLineMatch.groups.indentation
                );
                const block = new Block(line, level, "text");
                flatBlocks.push(block);
            } else {
                flatBlocks.push(new Block(line, 1, "text"));
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
        return levelsOfIndentation + 1;
    }
}
