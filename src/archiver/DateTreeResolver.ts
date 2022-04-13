import { Settings } from "../Settings";
import { Block } from "../model/Block";
import { ListBlock } from "../model/ListBlock";
import { IndentationSettings } from "../IndentationSettings";
import {
    addSurroundingNewlines,
    findBlockRecursively,
    stripSurroundingNewlines,
} from "../Util";

type DateLevel = "years" | "months" | "weeks" | "days";

export class DateTreeResolver {
    private readonly dateFormats: Map<DateLevel, string>;
    private readonly dateLevels: DateLevel[];
    private readonly indentationSettings: IndentationSettings;

    constructor(private readonly settings: Settings) {
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

    mergeNewBlocksWithDateTree(root: Block, newBlocks: Block[]) {
        root.children = stripSurroundingNewlines(root.children);
        const insertionPoint = this.getCurrentDateBlock(root);
        insertionPoint.children = [...insertionPoint.children, ...newBlocks];
        if (this.settings.addNewlinesAroundHeadings) {
            root.children = addSurroundingNewlines(root.children);
        }
    }

    private getCurrentDateBlock(tree: Block) {
        const dateLines = this.dateLevels.map((l) => this.buildDateLine(l));

        let context = tree;
        for (const dateLine of dateLines) {
            const thisDateInArchive = findBlockRecursively(
                context.children,
                (b) => b.text === dateLine
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
