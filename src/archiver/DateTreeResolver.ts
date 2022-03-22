import { ArchiverSettings } from "./ArchiverSettings";
import { Block } from "../model/Block";
import { ListBlock } from "../model/ListBlock";

type DateLevel = "years" | "months" | "weeks" | "days";

export class DateTreeResolver {
    private readonly dateFormats: Map<DateLevel, string>;
    private readonly dateLevels: DateLevel[];

    constructor(private readonly settings: ArchiverSettings) {
        this.dateLevels = [];
        if (settings.useWeeks) {
            this.dateLevels.push("weeks");
        }
        if (settings.useDays) {
            this.dateLevels.push("days");
        }

        this.dateFormats = new Map([
            ["days", settings.dailyNoteFormat],
            ["weeks", settings.weeklyNoteFormat],
        ]);
    }

    mergeNewBlocksWithDateTree(tree: Block, newBlocks: Block[]) {
        const insertionPoint = this.getCurrentDateBlock(tree);
        newBlocks.forEach((block) => {
            // todo: manual indentation
            this.addIndentationRecursively(block);
            insertionPoint.appendChild(block);
        });
    }

    private addIndentationRecursively(block: Block) {
        block.text = this.indentFor(this.dateLevels.length) + block.text;
        for (const child of block.children) {
            this.addIndentationRecursively(child);
        }
    }

    private getCurrentDateBlock(tree: Block) {
        let parentBlock = tree;

        // TODO: cludge for newlines
        parentBlock.children = parentBlock.children.filter(
            DateTreeResolver.isBlockNonEmpty
        );

        for (const [i, level] of this.dateLevels.entries()) {
            const indentedDateLine = this.buildDateLine(i, level);
            // TODO: kludge for null
            const thisDateInArchive = tree.findRecursively(
                (b) => b.text !== null && b.text === indentedDateLine
            );

            if (thisDateInArchive) {
                parentBlock = thisDateInArchive;
            } else {
                // TODO: manual indentation?
                const newBlock = new ListBlock(indentedDateLine, 1);
                tree.appendChild(newBlock);
                parentBlock = newBlock;
            }
        }
        return parentBlock;
    }

    private static isBlockNonEmpty(block: Block) {
        // TODO: kludge for null
        return block.text !== null && block.text.trim().length > 0;
    }

    private indentFor(levels: number) {
        const settings = this.settings.indentationSettings;
        const oneLevelOfIndentation = settings.useTab
            ? "\t"
            : " ".repeat(settings.tabSize);
        return oneLevelOfIndentation.repeat(levels);
    }

    private buildDateLine(lineLevel: number, dateTreeLevel: DateLevel) {
        const dateFormat = this.dateFormats.get(dateTreeLevel);
        const date = window.moment().format(dateFormat);
        // TODO: hardcoded list token
        // todo: hardcoded link
        // TODO: manual indentation
        return this.indentFor(lineLevel) + `- [[${date}]]`;
    }
}
