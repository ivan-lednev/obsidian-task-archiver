import { ArchiverSettings } from "./ArchiverSettings";
import escapeStringRegexp from "escape-string-regexp";
import { Block, BlockParser, Parser, Section } from "./Parser";

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
                lines: lines,
            };
        }

        // TODO: works only for top level sections
        let archiveSection = tree.sections.find((s) =>
            this.archivePattern.test(s.text)
        );
        // TODO: no need to extract stuff, just pass the section handle to the archive
        // and then I can just move the archive search or creation to a common place
        const archiveLines = archiveSection
            ? this.extractSectionContents(archiveSection)
            : [];

        // --- old stuff ---

        const archive = new Archive(archiveLines, this.settings);
        let archiveContentsWithNewTasks =
            archive.appendCompletedTasks(newlyCompletedTasks);

        if (this.settings.addNewlinesAroundHeadings) {
            archiveContentsWithNewTasks = [
                "",
                ...archiveContentsWithNewTasks,
                "",
            ];
        }
        // ---

        const newArchiveBlocks = new BlockParser(
            this.settings.indentationSettings
        ).parse(archiveContentsWithNewTasks);

        if (!archiveSection) {
            const heading = this.buildArchiveHeading();
            archiveSection = new Section(heading, 1, newArchiveBlocks);
            tree.append(archiveSection);
        }
        archiveSection.blockContent = newArchiveBlocks;

        return {
            summary: `Archived ${newlyCompletedTasks.length} lines`,
            lines: tree.stringify(),
        };
    }

    private buildArchiveHeading() {
        // TODO: do it some place else
        // let archiveHeading = ""
        // if (this.settings.addNewlinesAroundHeadings) {
        //     archiveHeading += "\n";
        // }
        const headingToken = "#".repeat(this.settings.archiveHeadingDepth);
        return `${headingToken} ${this.settings.archiveHeading}`;
    }

    private extractNewlyCompletedTasks(tree: Section) {
        const newlyCompletedTaskBlocks = tree.extractBlocksRecursively(
            // TODO: got me again
            this.isCompletedTask.bind(this),
            this.isNonArchiveHeading.bind(this)
        );
        // TODO: no need to extract them as string after a rewrite
        const newlyCompletedTasks = this.getBlocksAsStrings(
            newlyCompletedTaskBlocks
        );

        return newlyCompletedTasks;
    }

    // TODO: the AST should not leak details about bullets or heading tokens
    // TODO: duplicated regex
    private isCompletedTask(line: string) {
        return /^(?<listMarker>[-*]|\d+\.) \[x\]/.test(line);
    }

    private isNonArchiveHeading(heading: string) {
        return !this.archivePattern.test(heading);
    }

    // TODO: remove after a rewrite
    private getBlocksAsStrings(blocks: Block[]) {
        return blocks
            .map((b) => {
                return b.stringify();
            })
            .reduce((acc, current) => {
                return acc.concat(current);
            }, []);
    }

    private extractSectionContents(section: Section) {
        const archiveLines = this.getBlocksAsStrings(
            section.blockContent.blocks
        ).filter((line) => line.trim().length > 0);
        return archiveLines;
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
