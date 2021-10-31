import { ArchiverSettings } from "./ArchiverSettings";
import escapeStringRegexp from "escape-string-regexp";
import { Parser } from "./Parser";

const INDENTED_LINE_PATTERN = /^( {2,}|\t)\s*\S+/;
const COMPLETED_TASK_PATTERN = /^(-|\d+\.) \[x\] /;

export class Archiver {
    private settings: ArchiverSettings;
    private archivePattern: RegExp;
    private archiveEndPattern: RegExp;

    constructor(settings: ArchiverSettings) {
        this.settings = settings;
        const escapedHeading = escapeStringRegexp(settings.archiveHeading);
        this.archivePattern = new RegExp(`^#+\\s+${escapedHeading}`);
        this.archiveEndPattern = new RegExp(`^#+\\s+(?!${escapedHeading})`);
    }

    archiveTasks(lines: string[]) {
        // todo: this should be true only for one of the flows
        if (!this.doLinesContainArchive(lines)) {
            lines = this.addEmptyArchive(lines);
        }

        const archiveLines = this.extractArchiveContents(lines);
        const archive = new Archive(archiveLines, this.settings);
        
        const { newlyCompletedTasks, linesWithoutCompletedTasks } =
            this.extractNewlyCompletedTasks(lines);

        if (newlyCompletedTasks.length === 0) {
            return {
                summary: "No tasks to archive",
                lines: lines,
            };
        }

        const linesWithInsertedArchivedTasks = this.addTasksToArchive(
            newlyCompletedTasks,
            linesWithoutCompletedTasks,
            archive
        );

        return {
            summary: `Archived ${newlyCompletedTasks.length} lines`,
            lines: linesWithInsertedArchivedTasks,
        };
    }

    private doLinesContainArchive(lines: string[]) {
        return lines.findIndex((line) => this.archivePattern.exec(line)) >= 0;
    }

    private addEmptyArchive(lines: string[]) {
        const linesWithArchive = [...lines];
        const noNewline = linesWithArchive[lines.length - 1].trim() !== "";
        if (noNewline && this.settings.addNewlinesAroundHeadings) {
            linesWithArchive.push("");
        }
        const headingToken = "#".repeat(this.settings.archiveHeadingDepth);
        linesWithArchive.push(
            `${headingToken} ${this.settings.archiveHeading}`
        );
        return linesWithArchive;
    }

    private extractNewlyCompletedTasks(lines: string[]) {
        const parser = new Parser(this.settings.indentationSettings);
        const tree = parser.parse(lines);
        // TODO: the AST should not leak details about bullets or heading tokens
        // TODO: duplicated regex

        const isCompletedTask = (line: string) =>
            /^(?<listMarker>[-*]|\d+\.) \[x\]/.test(line);
        const isNonArchiveHeading = (heading: string) =>
            !this.archivePattern.test(heading);

        const newlyCompletedTasks = tree
            .extractBlocksRecursively(isCompletedTask, isNonArchiveHeading)
            .map((block) => block.stringify())
            .reduce((acc, current) => {
                return acc.concat(current);
            }, []);

        // TODO: remove the archive as a shim, remove this code later
        const archiveSection = tree.sections.find((s) =>
            this.archivePattern.test(s.text)
        );
        archiveSection.blockContent.blocks
            .slice() // TODO: this iteration with mutation got me again!
            .map((b) => {
                // TODO: secretly removing it from the tree here
                b.removeSelf();
                return b.stringify();
            });

        const linesWithoutCompletedTasks = tree.stringify();
        return { newlyCompletedTasks, linesWithoutCompletedTasks };
    }

    private extractArchiveContents(lines: string[]) {
        const parser = new Parser(this.settings.indentationSettings);
        const tree = parser.parse(lines);

        const archiveSection = tree.sections.find((s) =>
            this.archivePattern.test(s.text)
        );
        // TODO: duplication
        const archiveLines = archiveSection.blockContent.blocks
            .slice() // TODO: this iteration with mutation got me again!
            .map((b) => {
                // TODO: secretly removing it from the tree here
                b.removeSelf();
                return b.stringify();
            })
            .reduce((acc, current) => {
                return acc.concat(current);
            }, [])
            .filter((line) => line.trim().length > 0);
        return archiveLines;
    }

    private addTasksToArchive(
        tasks: string[],
        lines: string[],
        archive: Archive
    ) {
        let archiveContentsWithNewTasks = archive.appendCompletedTasks(tasks);
        if (this.settings.addNewlinesAroundHeadings) {
            archiveContentsWithNewTasks = [
                "",
                ...archiveContentsWithNewTasks,
                "",
            ];
        }

        const archiveStart = lines.findIndex((l) =>
            this.archivePattern.exec(l)
        );

        lines.splice(archiveStart + 1, 0, ...archiveContentsWithNewTasks);
        return lines;
    }
}

class Archive {
    private contents: string[];
    private dateLevels: string[];
    private dateFormats: Map<string, string>;
    private settings: ArchiverSettings;

    constructor(lines: string[], settings: ArchiverSettings) {
        this.contents = lines;
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
    }

    appendCompletedTasks(lines: string[]) {
        const indentationSettings = this.settings.indentationSettings;
        const indentation = indentationSettings.useTab
            ? "\t"
            : " ".repeat(indentationSettings.tabSize);

        const thisMoment = window.moment();
        const newContents = [...this.contents];

        let contentInsertionIndex = newContents.length;
        let searchStartIndexForNextDateLevel = 0;
        for (const [i, level] of this.dateLevels.entries()) {
            const dateFormat = this.dateFormats.get(level);
            const date = thisMoment.format(dateFormat);
            const indentedDateLine = indentation.repeat(i) + `- [[${date}]]`;

            const positionOfthisDateInArchive = this.contents.findIndex(
                (line, i) =>
                    i >= searchStartIndexForNextDateLevel &&
                    line.includes(indentedDateLine)
            );
            const thisDateIsInArchive = positionOfthisDateInArchive >= 0;

            if (thisDateIsInArchive) {
                const lineAfterThisDate = positionOfthisDateInArchive + 1;
                searchStartIndexForNextDateLevel = lineAfterThisDate;
                contentInsertionIndex = this.findBlockEndByIndentation(
                    newContents,
                    positionOfthisDateInArchive
                );
            } else {
                newContents.push(indentedDateLine);
                contentInsertionIndex = newContents.length;
            }
        }

        const indentationForContent = this.dateLevels.length;
        const linesWithAddedIndentation = lines.map(
            (line) => indentation.repeat(indentationForContent) + line
        );

        newContents.splice(
            contentInsertionIndex,
            0,
            ...linesWithAddedIndentation
        );

        return newContents;
    }

    private findBlockEndByIndentation(list: string[], startIndex: number) {
        const initialIndentationLength = this.findIndentationLength(
            list[startIndex]
        );
        const lineAfterBlockStart = startIndex + 1;
        for (let i = lineAfterBlockStart; i < list.length; i++) {
            const indentationLength = this.findIndentationLength(list[i]);
            if (indentationLength <= initialIndentationLength) {
                return i;
            }
        }
        return list.length;
    }

    private findIndentationLength(line: string) {
        const leadingSpacePattern = /^\s*/;
        return leadingSpacePattern.exec(line)[0].length;
    }
}
