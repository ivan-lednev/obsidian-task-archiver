import moment from "moment";

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
        // todo
        const hasArchive =
            lines.findIndex((line) => this.ARCHIVE_PATTERN.exec(line)) >= 0;

        if (!hasArchive) {
            return lines;
        }

        const { linesWithoutArchive, archive } = this.extractArchive(lines);

        const { linesWithoutCompletedTasks, newlyCompletedTasks } =
            this.extractCompletedTasks(linesWithoutArchive);

        if (newlyCompletedTasks.length === 0) {
            return lines;
        }

        const linesWithInsertedArchivedTasks = this.addTasksToArchive(
            newlyCompletedTasks,
            linesWithoutCompletedTasks,
            archive
        );
        return linesWithInsertedArchivedTasks;
    }

    private extractCompletedTasks(linesWithoutArchive: string[]) {
        const linesWithoutCompletedTasks = [];
        const newlyCompletedTasks = [];

        let linesAfterTask = false;
        for (const line of linesWithoutArchive) {
            if (line.match(this.COMPLETED_TASK_PATTERN)) {
                newlyCompletedTasks.push(line);
                linesAfterTask = true;
            } else if (
                line.match(this.INDENTED_LINE_PATTERN) &&
                linesAfterTask
            ) {
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
                if (this.ARCHIVE_END_PATTERN.exec(line)) {
                    insideArchive = false;
                    linesWithoutArchive.push(line);
                } else {
                    archiveLines.push(line);
                }
            } else {
                if (this.ARCHIVE_PATTERN.exec(line)) {
                    insideArchive = true;
                }
                linesWithoutArchive.push(line);
            }
        }

        return { linesWithoutArchive, archive: new Archive(archiveLines) };
    }

    private addTasksToArchive(
        tasks: string[],
        lines: string[],
        archive: Archive
    ) {
        if (this.useDateTree) {
            const week = moment().format("YYYY-MM-[W]-w");
            tasks = tasks.map((line) => `    ${line}`);
            const weekLine = `- [[${week}]]`;
            const weekPresentInDateTree = lines.find((line) =>
                line.startsWith(weekLine)
            );
            if (weekPresentInDateTree) {
                // todo
            } else {
                tasks.splice(0, 0, weekLine);
            }
        }

        const archiveWithNewTasks = archive.appendToContents(tasks);
        const archiveStart = lines.findIndex((l) =>
            this.ARCHIVE_PATTERN.exec(l)
        );
        lines.splice(archiveStart + 1, 0, ...archiveWithNewTasks);
        return lines;
    }
}

class Archive {
    contents: string[];
    constructor(lines: string[]) {
        this.contents = lines;
    }

    appendToContents(lines: string[]) {
        const afterLastLineWithContent =
            this.contents.length -
            this.contents
                .slice()
                .reverse()
                .findIndex((l) => l.match(/\S/));
        this.contents.splice(afterLastLineWithContent, 0, ...lines);
        return this.contents;
    }
}
