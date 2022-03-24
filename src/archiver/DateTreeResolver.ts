import { ArchiverSettings } from "./ArchiverSettings";
import { Block } from "../model/Block";
import { ListBlock } from "../model/ListBlock";
import { IndentationSettings } from "../parser/IndentationSettings";

type DateLevel = "years" | "months" | "weeks" | "days";

export class DateTreeResolver {
    private readonly dateFormats: Map<DateLevel, string>;
    private readonly dateLevels: DateLevel[];
    private readonly indentationSettings: IndentationSettings;

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
        this.indentationSettings = settings.indentationSettings;
    }

    mergeNewBlocksWithDateTree(tree: Block, newBlocks: Block[]) {
        const insertionPoint = this.getCurrentDateBlock(tree);
        for (const block of newBlocks) {
            insertionPoint.appendChild(block);
        }
    }

    private getCurrentDateBlock(tree: Block) {
        let context = tree;

        context.children = context.children.filter((block: Block) => {
            // TODO: kludge for null
            return block.text !== null && block.text.trim().length > 0;
        });

        for (const level of this.dateLevels) {
            const dateLine = this.buildDateLine(level);
            // TODO: kludge for null
            const thisDateInArchive = context.findRecursively(
                (b) => b.text !== null && b.text === dateLine
            );

            if (thisDateInArchive) {
                context = thisDateInArchive;
            } else {
                const newBlock = new ListBlock(dateLine);
                context.appendChild(newBlock);
                context = newBlock;
            }
        }
        return context;
    }

    private buildDateLine(dateTreeLevel: DateLevel) {
        const dateFormat = this.dateFormats.get(dateTreeLevel);
        const date = window.moment().format(dateFormat);
        // TODO: hardcoded link
        return `- [[${date}]]`;
    }
}
