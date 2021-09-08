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
        const archiveWithNewTasks = archive.appendToContents(tasks);
        const archiveStart = lines.findIndex((l) =>
            this.archivePattern.exec(l)
        );
        lines.splice(archiveStart + 1, 0, ...archiveWithNewTasks);
        return lines;
    }
}

class Archive {
    contents: string[];
    settings: ArchiverSettings;

    constructor(lines: string[], settings: ArchiverSettings) {
        this.contents = lines;
        this.settings = settings;
    }

    appendToContents(indentedLines: string[]) {
        let insertionIndex;

        const indentationSettings = this.settings.indentationSettings;
        const indentation = indentationSettings.useTab
            ? "\t"
            : " ".repeat(indentationSettings.tabSize);
        let indentationForNewContent = ""

        if (this.settings.useDays) {
            const day = window.moment().format(this.settings.dailyNoteFormat);

            indentedLines = indentedLines.map((line) => `${indentation}${line}`);
            const dayLine = `- [[${day}]]`;
            const thisDayIsInTree = this.contents.find((line) =>
                line.includes(dayLine)
            );
            if (thisDayIsInTree) {
                // todo the problem is here: weekly finder doesn't see the daily block, it only works with newly completed tasks
                insertionIndex = this.findBlockEnd(day);
            } else {
                indentedLines.unshift(dayLine);
            }
        }

        if (this.settings.useWeeks) {
            const week = window.moment().format(this.settings.weeklyNoteFormat);

            indentedLines = indentedLines.map((line) => `${indentation}${line}`);
            const weekLine = `- [[${week}]]`;
            const thisWeekIsInTree = this.contents.find((line) =>
                line.includes(weekLine)
            );
            if (thisWeekIsInTree) {
                insertionIndex = this.findBlockEnd(weekLine);
            } else {
                indentedLines.unshift(weekLine);
            }
        }

        if (!insertionIndex) {
            insertionIndex = this.contents.length;
        }

        this.contents.splice(insertionIndex, 0, ...indentedLines);

        return ["", ...this.contents, ""];
    }

    private findBlockEnd(parentLine: string) {
        let insideBlock = false;
        for (const [i, line] of this.contents.entries()) {
            if (line === parentLine) {
                insideBlock = true;
                continue;
            }

            const isLineIndented = INDENTED_LINE_PATTERN.exec(line);
            if (insideBlock && !isLineIndented) {
                return i;
            }
        }
        return this.contents.length;
    }
}
