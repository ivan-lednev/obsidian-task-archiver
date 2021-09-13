import { ArchiverSettings } from "./ArchiverSettings";
import escapeStringRegexp from "escape-string-regexp";

const INDENTED_LINE_PATTERN = new RegExp("^( {2,}|\\t)\\s*\\S+");
const COMPLETED_TASK_PATTERN = new RegExp("^(-|\\d+\\.) \\[x\\] ");

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
        const hasArchive =
            lines.findIndex((line) => this.archivePattern.exec(line)) >= 0;

        if (!hasArchive) {
            if (lines[lines.length - 1].trim() !== "") {
                lines.push("");
            }
            lines.push(`# ${this.settings.archiveHeading}`);
        }

        const { linesWithoutArchive, archive } = this.extractArchive(lines);

        const { linesWithoutCompletedTasks, newlyCompletedTasks } =
            this.extractCompletedTasks(linesWithoutArchive);

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

    private extractCompletedTasks(linesWithoutArchive: string[]) {
        const linesWithoutCompletedTasks = [];
        const newlyCompletedTasks = [];

        let linesAfterTask = false;
        for (const line of linesWithoutArchive) {
            if (line.match(COMPLETED_TASK_PATTERN)) {
                newlyCompletedTasks.push(line);
                linesAfterTask = true;
            } else if (line.match(INDENTED_LINE_PATTERN) && linesAfterTask) {
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

    private extractArchive(lines: string[]) {
        let archiveLines = [];
        let linesWithoutArchive = [];

        let insideArchive = false;

        for (const line of lines) {
            if (insideArchive) {
                if (this.archiveEndPattern.exec(line)) {
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
        const archiveWithNewTasks = archive.appendCompletedTasks(tasks);
        const archiveStart = lines.findIndex((l) =>
            this.archivePattern.exec(l)
        );
        lines.splice(archiveStart + 1, 0, ...archiveWithNewTasks);
        return lines;
    }
}

class Archive {
    contents: string[];
    dateLevels: string[];
    dateFormats: Map<string, string>;
    settings: ArchiverSettings;

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

        return ["", ...newContents, ""];
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
        return list.length
    }

    private findIndentationLength(line: string) {
        const leadingSpacePattern = /^\s*/;
        return leadingSpacePattern.exec(line)[0].length;
    }
}
