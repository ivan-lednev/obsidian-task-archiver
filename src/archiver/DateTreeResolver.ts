import { ArchiverSettings } from "./ArchiverSettings";
import { Block } from "../model/Block";

type DateLevel = "years" | "months" | "weeks" | "days";

export class DateTreeResolver {
    private readonly dateFormats: Map<DateLevel, string>;
    private readonly dateLevels: DateLevel[];
    private readonly indentation: string;

    constructor(private readonly settings: ArchiverSettings) {
        this.dateLevels = [];
        if (settings.useWeeks) {
            this.dateLevels.push("weeks");
        }
        if (settings.useDays) {
            this.dateLevels.push("days");
        }

        // todo: this.settings -> settings
        this.dateFormats = new Map([
            ["days", this.settings.dailyNoteFormat],
            ["weeks", this.settings.weeklyNoteFormat],
        ]);

        this.indentation = this.buildIndentation();
    }

    mergeBlocksWithTree(tree: Block, newBlocks: Block[]) {
        let parentBlock = tree;

        // TODO: cludge for newlines
        parentBlock.children = parentBlock.children.filter(
            (b) => b.text !== null && b.text.trim().length > 0
        );

        for (const [i, level] of this.dateLevels.entries()) {
            const indentedDateLine = this.buildDateLine(i, level);
            const thisDateInArchive = tree.findRecursively(
                (b) => b.text !== null && b.text === indentedDateLine
            );

            if (thisDateInArchive !== null) {
                parentBlock = thisDateInArchive;
            } else {
                // TODO, this will break once I stringify based on levels
                const newBlock = new Block(indentedDateLine, 1, "list");
                tree.append(newBlock);
                parentBlock = newBlock;
            }
        }

        // TODO: Don't add indentation manually. Do it based on level while stringifying things
        const indentation = this.indentation.repeat(this.dateLevels.length);

        // TODO: TreeWalker will make this obsolete
        const addIndentationRecursively = (block: Block) => {
            block.text = indentation + block.text;
            block.children.forEach(addIndentationRecursively);
        };

        newBlocks.forEach((block) => {
            addIndentationRecursively(block);
            parentBlock.append(block);
        });
    }

    private buildIndentation() {
        const settings = this.settings.indentationSettings;
        return settings.useTab ? "\t" : " ".repeat(settings.tabSize);
    }

    private buildDateLine(lineLevel: number, dateTreeLevel: DateLevel) {
        const thisMoment = window.moment();
        const dateFormat = this.dateFormats.get(dateTreeLevel);
        const date = thisMoment.format(dateFormat);
        // TODO: hardcoded list token
        return this.indentation.repeat(lineLevel) + `- [[${date}]]`;
    }
}
