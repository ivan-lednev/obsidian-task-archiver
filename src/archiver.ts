import { ArchiverSettings } from "./ArchiverSettings";
import escapeStringRegexp from "escape-string-regexp";
import { Block, Parser, Section } from "./Parser";

export class Archiver {
    private settings: ArchiverSettings;
    private archivePattern: RegExp;

    constructor(settings: ArchiverSettings) {
        this.settings = settings;
        const escapedHeading = escapeStringRegexp(settings.archiveHeading);
        this.archivePattern = new RegExp(`^#+\\s+${escapedHeading}`);
    }

    archiveTasks(lines: string[]) {
        const parser = new Parser(this.settings.indentationSettings);
        const tree = parser.parse(lines);

        const newlyCompletedTasks = this.extractNewlyCompletedTasks(tree);

        if (newlyCompletedTasks.length === 0) {
            return {
                summary: "No tasks to archive",
                lines,
            };
        }

        this.archiveToThisFile(tree, newlyCompletedTasks);

        return {
            summary: `Archived ${newlyCompletedTasks.length} lines`,
            lines: tree.stringify(),
        };
    }

    private archiveToThisFile(tree: Section, tasks: Block[]) {
        // TODO: works only for top level sections
        let archiveSection = tree.sections.find((s) =>
            this.archivePattern.test(s.text)
        );
        // TODO: no need to extract stuff, just pass the section handle to the archive
        // and then I can just move the archive search or creation to a common place
        const archiveContents = archiveSection
            ? archiveSection.blockContent
            : new Block(null, 0, "root");

        const archive = new Archive(archiveContents, this.settings);
        let archiveContentsWithNewTasks = archive.appendCompletedTasks(tasks);

        this.complyWithNewlineRules(archiveContentsWithNewTasks);

        if (!archiveSection) {
            const heading = this.buildArchiveHeading();
            archiveSection = new Section(
                heading,
                1,
                archiveContentsWithNewTasks
            );
            tree.append(archiveSection);
        }
    }

    private complyWithNewlineRules(blockContent: Block) {
        if (this.settings.addNewlinesAroundHeadings) {
            // TODO: leaking details about block types
            blockContent.appendFirst(new Block("", 1, "text"));
            blockContent.append(new Block("", 1, "text"));
        }
    }

    private buildArchiveHeading() {
        // TODO: if there is no archive heading, I should build an ast, not a manual thing
        const headingToken = "#".repeat(this.settings.archiveHeadingDepth);
        return `${headingToken} ${this.settings.archiveHeading}`;
    }

    private extractNewlyCompletedTasks(tree: Section) {
        // TODO: pass a struct, not 2 arguments
        // TODO: I check lines here, but pass blocks to matchers elsewhere, need consistency
        // TODO: the AST should not leak details about bullets or heading tokens
        // TODO: duplicated regex
        return tree.extractBlocksRecursively(
            (line: string) => /^(?<listMarker>[-*]|\d+\.) \[x\]/.test(line),
            (heading: string) => !this.archivePattern.test(heading)
        );
    }
}

class Archive {
    private readonly contents: Block;
    private readonly dateLevels: string[];
    private readonly dateFormats: Map<string, string>;
    private readonly settings: ArchiverSettings;
    private readonly indentation: string;

    constructor(contents: Block, settings: ArchiverSettings) {
        this.contents = contents;
        this.settings = settings;
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
    }

    private buildIndentation() {
        const settings = this.settings.indentationSettings;
        return settings.useTab ? "\t" : " ".repeat(settings.tabSize);
    }

    appendCompletedTasks(newCompletedTasks: Block[]) {
        let parentBlock = this.contents;

        // TODO: cludge for newlines
        parentBlock.blocks = parentBlock.blocks.filter(
            (b) => b.text !== null && b.text.trim().length > 0
        );

        for (const [i, level] of this.dateLevels.entries()) {
            const indentedDateLine = this.buildDateLine(i, level);
            const thisDateInArchive = this.contents.findRecursively(
                (b) => b.text !== null && b.text === indentedDateLine
            );

            if (thisDateInArchive !== null) {
                parentBlock = thisDateInArchive;
            } else {
                // TODO, this will break once I stringify based on levels
                const newBlock = new Block(indentedDateLine, 1, "list");
                this.contents.append(newBlock);
                parentBlock = newBlock;
            }
        }

        // TODO: Don't add indentation manually. Do it based on level while stringifying things
        const indentation = this.indentation.repeat(this.dateLevels.length);
        newCompletedTasks.forEach((block) => {
            block.text = indentation + block.text;
            parentBlock.append(block);
        });

        return this.contents;
    }

    private buildDateLine(lineLevel: number, dateTreeLevel: string) {
        const thisMoment = window.moment();
        const dateFormat = this.dateFormats.get(dateTreeLevel);
        const date = thisMoment.format(dateFormat);
        return this.indentation.repeat(lineLevel) + `- [[${date}]]`;
    }
}
