import { ArchiverSettings } from "./ArchiverSettings";
import moment from "moment";
import { Notice } from "obsidian";

const INDENTED_LINE_PATTERN = new RegExp("^( {2,}|\\t)\\s*\\S+");
const COMPLETED_TASK_PATTERN = new RegExp("^- \\[x\\] ");

export class Archiver {
    private settings: ArchiverSettings;
    private archivePattern: RegExp;
    private archiveEndPattern: RegExp;

    constructor(settings: ArchiverSettings) {
        this.settings = settings;
        this.archivePattern = new RegExp(`^#+\\s+${settings.archiveHeading}`);
        this.archiveEndPattern = new RegExp(
            `^#+\\s+(?!${settings.archiveHeading})`
        );
    }

    archiveTasks(lines: string[]) {
        const hasArchive =
            lines.findIndex((line) => this.archivePattern.exec(line)) >= 0;

        if (!hasArchive) {
            return {
                summary: `To achive tasks, please create a heading with the text: '${this.settings.archiveHeading}'`,
                lines: lines,
            };
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

    appendToContents(newLines: string[]) {
        let insertionIndex;

        if (this.settings.useDateTree) {
            const week = moment().format(this.settings.weeklyNoteFormat);
            const indentationSettings = this.settings.indentationSettings;
            const indentation = indentationSettings.useTab
                ? "\t"
                : " ".repeat(indentationSettings.tabSize);
            newLines = newLines.map((line) => `${indentation}${line}`);
            const weekLine = `- [[${week}]]`;
            const currentWeekIndexInTree = this.contents.findIndex((line) =>
                line.startsWith(weekLine)
            );
            if (currentWeekIndexInTree < 0) {
                newLines.unshift(weekLine);
            } else {
                insertionIndex = this.findBlockEnd(weekLine);
            }
        }

        if (!insertionIndex) {
            insertionIndex = this.contents.length;
        }

        this.contents.splice(insertionIndex, 0, ...newLines);

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
