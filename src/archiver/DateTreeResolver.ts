import { ArchiverSettings } from "./ArchiverSettings";
import { Block } from "../model/Block";
import { ListBlock } from "../model/ListBlock";
import { IndentationSettings } from "./IndentationSettings";
import { findBlockRecursively } from "../util";
import { chain } from "lodash";
import { TextBlock } from "../model/TextBlock";

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

    private static stripSurroundingNewlines(blocks: Block[]) {
        const isEmpty = (block: Block) => block.text.trim().length === 0;
        return chain(blocks).dropWhile(isEmpty).dropRightWhile(isEmpty).value();
    }

    private static addSurroundingNewlines(blocks: Block[]) {
        const empty = new TextBlock("");
        return [empty, ...blocks, empty];
    }

    mergeNewBlocksWithDateTree(tree: Block, newBlocks: Block[]) {
        tree.children = DateTreeResolver.stripSurroundingNewlines(tree.children);
        const insertionPoint = this.getCurrentDateBlock(tree);
        insertionPoint.children = [...insertionPoint.children, ...newBlocks];
        if (this.settings.addNewlinesAroundHeadings) {
            tree.children = DateTreeResolver.addSurroundingNewlines(tree.children);
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
