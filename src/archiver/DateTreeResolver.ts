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
            insertionPoint.appendChild(block);
        });
    }

    private getCurrentDateBlock(tree: Block) {
        let context = tree;

        context.children = context.children.filter((block: Block) => {
            // TODO: kludge for null
            return block.text !== null && block.text.trim().length > 0;
        });

        for (const [i, level] of this.dateLevels.entries()) {
            const dateLine = this.buildDateLine(i, level);
            // TODO: kludge for null
            const thisDateInArchive = context.findRecursively(
                (b) => b.text !== null && b.text === dateLine
            );

            if (thisDateInArchive) {
                context = thisDateInArchive;
            } else {
                // TODO: remove hardcoded indentation options
                const newBlock = new ListBlock(dateLine, i, {
                    useTab: true,
                    tabSize: 4,
                });
                context.appendChild(newBlock);
                context = newBlock;
            }
        }
        return context;
    }

    private buildDateLine(lineLevel: number, dateTreeLevel: DateLevel) {
        const dateFormat = this.dateFormats.get(dateTreeLevel);
        const date = window.moment().format(dateFormat);
        // TODO: hardcoded list token
        // TODO: hardcoded link
        return `- [[${date}]]`;
    }
}
