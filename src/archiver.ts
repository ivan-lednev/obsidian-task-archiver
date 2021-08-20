export class Archiver {
    private ARCHIVE_PATTERN = new RegExp("# Archived");
    private ARCHIVE_END_PATTERN = new RegExp("^#+\\s+(?!Archived)");
    private COMPLETED_TASK_PATTERN = new RegExp("- \\[x\\] ");
    private INDENTED_LINE_PATTERN = new RegExp("^( {2,}|\\t)\\s*\\S+");

    private useDateTree: boolean;

    constructor(useDateTree: boolean = false) {
        this.useDateTree = useDateTree;
    }

    archiveTasks(lines: string[]) {
        const hasArchive = lines.find((line) =>
            this.ARCHIVE_PATTERN.exec(line)
        );
        if (!hasArchive) {
            return lines;
        }

        const { fileLinesWithoutCompletedTasks, completedTasksOutsideArchive } =
            this.extractCompletedTasks(lines);

        if (completedTasksOutsideArchive.length === 0) {
            return lines;
        }

        const linesWithInsertedArchivedTasks = this.addTasksToArchive(
            completedTasksOutsideArchive,
            fileLinesWithoutCompletedTasks
        );
        return linesWithInsertedArchivedTasks;
    }

    private extractCompletedTasks(lines: string[]) {
        const fileLinesWithoutCompletedTasks = [];
        const completedTasksOutsideArchive = [];

        let insideArchive = false;
        let linesAfterTask = false;
        for (const line of lines) {
            if (this.ARCHIVE_PATTERN.exec(line)) {
                insideArchive = true;
            }

            if (insideArchive) {
                if (this.ARCHIVE_END_PATTERN.exec(line)) {
                    insideArchive = false;
                }
            }

            if (line.match(this.COMPLETED_TASK_PATTERN) && !insideArchive) {
                completedTasksOutsideArchive.push(line);
                linesAfterTask = true;
            } else if (
                line.match(this.INDENTED_LINE_PATTERN) &&
                linesAfterTask
            ) {
                completedTasksOutsideArchive.push(line);
            } else {
                fileLinesWithoutCompletedTasks.push(line);
                linesAfterTask = false;
            }
        }
        return { fileLinesWithoutCompletedTasks, completedTasksOutsideArchive };
    }

    private addTasksToArchive(tasks: string[], lines: string[]) {
        const linesWithInsertedArchivedTasks = [...lines];
        if (this.useDateTree) {
            tasks = tasks.map((line) => `    ${line}`);
            tasks.splice(0, 0, "- [[week]]");
        }

        let insideArchive = false;
        let lastNonBlankLineIndex = null;
        for (const [i, line] of linesWithInsertedArchivedTasks.entries()) {
            const isArchiveStart = this.ARCHIVE_PATTERN.exec(line) !== null;
            if (isArchiveStart) {
                insideArchive = true;
            }

            if (insideArchive) {
                const isEndOfArchive = this.ARCHIVE_END_PATTERN.exec(line);
                const isLastLine =
                    i === linesWithInsertedArchivedTasks.length - 1;
                if (isEndOfArchive || isLastLine) {
                    let insertionIndex = i + 1;
                    if (isEndOfArchive) {
                        if (lastNonBlankLineIndex !== null) {
                            insertionIndex = lastNonBlankLineIndex + 1;
                        } else {
                            insertionIndex = i;
                        }
                    }
                    linesWithInsertedArchivedTasks.splice(
                        insertionIndex,
                        0,
                        ...tasks
                    );
                    break;
                }
                if (line.match(/\S/)) {
                    lastNonBlankLineIndex = i;
                }
            }
        }
        return linesWithInsertedArchivedTasks;
    }
}
