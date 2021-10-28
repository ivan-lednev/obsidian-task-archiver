import { ArchiverSettings } from "./ArchiverSettings";
import escapeStringRegexp from "escape-string-regexp";

const INDENTED_LINE_PATTERN = /^( {2,}|\t)\s*\S+/;
const COMPLETED_TASK_PATTERN = /^(-|\d+\.) \[x\] /;


class TaskExtractor {
    settings: ArchiverSettings;

    constructor(settings: ArchiverSettings) {
        // todo: give him only the heading
        this.settings = settings;
    }

    extractCompletedTasks(lines: string[]) {
        const withoutCompleted = [];
        const completed = [];

        let currentHeading = "";
        let insideTask = false;

        const escapedHeading = escapeStringRegexp(this.settings.archiveHeading);
        const archivePattern = new RegExp(`^#+\\s+${escapedHeading}`);
        const archiveEndPattern = new RegExp(`^#+\\s+(?!${escapedHeading})`);

        const headingStack = [];
        const currentHeadingLevel = 0;
        const heading = /^(#+)\s.*$/;

        for (const line of lines) {
            const headingMatch = heading.exec(line)
            if (headingMatch) {
                currentHeadingLevel
            }
            const isCompletedTask = COMPLETED_TASK_PATTERN.test(line);
            const isLineAfterCompletedTask =
                INDENTED_LINE_PATTERN.test(line) && insideTask;
            if (isCompletedTask) {
                completed.push(line);
                insideTask = true;
            } else if (isLineAfterCompletedTask) {
                completed.push(line);
            } else {
                withoutCompleted.push(line);
                insideTask = false;
            }
        }
        return {
            linesWithoutCompletedTasks: withoutCompleted,
            newlyCompletedTasks: completed,
        };
    }
}

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

        const { linesWithoutArchive, archive } =
            this.extractArchiveContents(lines);

        const { linesWithoutCompletedTasks, newlyCompletedTasks } =
            this.extractNewlyCompletedTasks(linesWithoutArchive);

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
        const linesWithoutCompletedTasks = [];
        const newlyCompletedTasks = [];

        let linesAfterTask = false;
        for (const line of lines) {
            if (COMPLETED_TASK_PATTERN.test(line)) {
                newlyCompletedTasks.push(line);
                linesAfterTask = true;
            } else if (INDENTED_LINE_PATTERN.test(line) && linesAfterTask) {
                newlyCompletedTasks.push(line);
            } else {
                linesWithoutCompletedTasks.push(line);
                linesAfterTask = false;
            }
        }
        return {
            linesWithoutCompletedTasks,
            newlyCompletedTasks,
        };
    }

    private extractArchiveContents(lines: string[]) {
        let archiveLines = [];
        let linesWithoutArchive = [];

        let insideArchive = false;

        for (const line of lines) {
            if (insideArchive) {
                if (this.archiveEndPattern.test(line)) {
                    insideArchive = false;
                    linesWithoutArchive.push(line);
                } else if (line.trim().length > 0) {
                    archiveLines.push(line);
                }
            } else {
                if (this.archivePattern.exec(line)) {
                    insideArchive = true;
                }
                linesWithoutArchive.push(line);
            }
        }

        return {
            linesWithoutArchive,
            archive: new Archive(archiveLines, this.settings),
        };
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
