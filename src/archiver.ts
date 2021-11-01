import { ArchiverSettings } from "./ArchiverSettings";
import escapeStringRegexp from "escape-string-regexp";
import { Block, Parser, Section } from "./Parser";

type DateLevel = "years" | "months" | "weeks" | "days";

export class Archiver {
    private readonly settings: ArchiverSettings;
    private readonly archivePattern: RegExp;
    private readonly dateLevels: DateLevel[];
    private readonly dateFormats: Map<DateLevel, string>;
    private readonly indentation: string;
    private readonly parser: Parser;

    constructor(settings: ArchiverSettings) {
        this.settings = settings;

        const escapedHeading = escapeStringRegexp(settings.archiveHeading);
        this.archivePattern = new RegExp(`^#+\\s+${escapedHeading}`);

        this.dateLevels = [];
        if (settings.useWeeks) {
            this.dateLevels.push("weeks");
        }
        if (settings.useDays) {
            this.dateLevels.push("days");
        }

        this.dateFormats = new Map([
            ["days", this.settings.dailyNoteFormat],
            ["weeks", this.settings.weeklyNoteFormat],
        ]);

        this.indentation = this.buildIndentation();
        this.parser = new Parser(this.settings.indentationSettings);
    }

    archiveTasks(linesWithTasks: string[]) {
        const treeWithTasks = this.parser.parse(linesWithTasks);
        const newlyCompletedTasks =
            this.extractNewlyCompletedTasks(treeWithTasks);

        if (newlyCompletedTasks.length === 0) {
            return {
                summary: "No tasks to archive",
                lines: linesWithTasks,
            };
        }

        const archiveTree = treeWithTasks;

        this.archiveToThisFile(archiveTree, newlyCompletedTasks);

        return {
            summary: `Archived ${newlyCompletedTasks.length} lines`,
            lines: treeWithTasks.stringify(),
        };
    }

    // todo: copypaste
    archiveTasksToSeparateFile(linesWithTasks: string[], archive: string[]) {
        const treeWithTasks = this.parser.parse(linesWithTasks);
        const newlyCompletedTasks =
            this.extractNewlyCompletedTasks(treeWithTasks);

        if (newlyCompletedTasks.length === 0) {
            return {
                summary: "No tasks to archive",
                lines: linesWithTasks,
            };
        }

        const archiveTree = this.parser.parse(archive);

        this.archiveToThisFile(archiveTree, newlyCompletedTasks);

        return {
            summary: `Archived ${newlyCompletedTasks.length} lines`,
            lines: treeWithTasks.stringify(),
            archiveLines: archiveTree.stringify(),
        };
    }

    private archiveToThisFile(tree: Section, completedTasks: Block[]) {
        const archiveBlock = this.getArchiveSection(tree).blockContent;
        this.appendCompletedTasks(archiveBlock, completedTasks);
        this.addNewLinesIfNeeded(archiveBlock);
    }

    private getArchiveSection(tree: Section) {
        // TODO: (later) works only for top level sections
        // Archives are always top-level, even when people use ## as top-level
        // But people can use # for file names
        let archiveSection = tree.sections.find((s) =>
            this.archivePattern.test(s.text)
        );
        if (!archiveSection) {
            const heading = this.buildArchiveHeading();
            const rootBlock = new Block(null, 0, "root");
            archiveSection = new Section(heading, 1, rootBlock);
            tree.append(archiveSection);
        }
        return archiveSection;
    }

    private extractNewlyCompletedTasks(tree: Section) {
        // TODO: the AST should not leak details about bullets or heading tokens
        // TODO: duplicated regex
        const filter = {
            // TODO: another needless null test
            blockFilter: (block: Block) =>
                block.text !== null &&
                /^(?<listMarker>[-*]|\d+\.) \[x\]/.test(block.text),
            sectionFilter: (section: Section) =>
                !this.archivePattern.test(section.text),
        };
        return tree.extractBlocksRecursively(filter);
    }

    appendCompletedTasks(contents: Block, newCompletedTasks: Block[]) {
        let parentBlock = contents;

        // TODO: cludge for newlines
        parentBlock.blocks = parentBlock.blocks.filter(
            (b) => b.text !== null && b.text.trim().length > 0
        );

        for (const [i, level] of this.dateLevels.entries()) {
            const indentedDateLine = this.buildDateLine(i, level);
            const thisDateInArchive = contents.findRecursively(
                (b) => b.text !== null && b.text === indentedDateLine
            );

            if (thisDateInArchive !== null) {
                parentBlock = thisDateInArchive;
            } else {
                // TODO, this will break once I stringify based on levels
                const newBlock = new Block(indentedDateLine, 1, "list");
                contents.append(newBlock);
                parentBlock = newBlock;
            }
        }

        // TODO: Don't add indentation manually. Do it based on level while stringifying things
        const indentation = this.indentation.repeat(this.dateLevels.length);
        // TODO: bug: this indents properly only top-level items

        // TODO: walkTree(visitor: NodeVisitor)
        const addIndentationRecursively = (block: Block) => {
            block.text = indentation + block.text;
            block.blocks.forEach(addIndentationRecursively);
        };

        newCompletedTasks.forEach((block) => {
            addIndentationRecursively(block);
            parentBlock.append(block);
        });
    }

    private buildDateLine(lineLevel: number, dateTreeLevel: DateLevel) {
        const thisMoment = window.moment();
        const dateFormat = this.dateFormats.get(dateTreeLevel);
        const date = thisMoment.format(dateFormat);
        return this.indentation.repeat(lineLevel) + `- [[${date}]]`;
    }

    private buildIndentation() {
        const settings = this.settings.indentationSettings;
        return settings.useTab ? "\t" : " ".repeat(settings.tabSize);
    }

    private buildArchiveHeading() {
        // TODO: if there is no archive heading, I should build an ast, not a manual thing
        const headingToken = "#".repeat(this.settings.archiveHeadingDepth);
        return `${headingToken} ${this.settings.archiveHeading}`;
    }

    private addNewLinesIfNeeded(blockContent: Block) {
        if (this.settings.addNewlinesAroundHeadings) {
            // TODO: leaking details about block types
            blockContent.appendFirst(new Block("", 1, "text"));
            blockContent.append(new Block("", 1, "text"));
        }
    }
}
