import { ArchiverSettings } from "./ArchiverSettings";
import escapeStringRegexp from "escape-string-regexp";
import { SectionParser } from "../parser/SectionParser";
import { Section } from "../model/Section";
import { Block } from "../model/Block";
import { Notice, TFile, Vault, Workspace } from "obsidian";

type DateLevel = "years" | "months" | "weeks" | "days";

export class Archiver {
    private readonly settings: ArchiverSettings;
    private readonly archivePattern: RegExp;
    private readonly dateLevels: DateLevel[];
    private readonly dateFormats: Map<DateLevel, string>;
    private readonly indentation: string;
    private readonly parser: SectionParser;
    private readonly workspace: Workspace;
    private readonly vault: Vault;

    constructor(vault: Vault, workspace: Workspace, settings: ArchiverSettings) {
        this.settings = settings;
        this.workspace = workspace;
        this.vault = vault;

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
        this.parser = new SectionParser(this.settings.indentationSettings);
    }

    async archiveTasksInActiveFile() {
        const activeFile = this.workspace.getActiveFile();
        const activeFileLines = await this.readFile(activeFile);
        const activeFileTree = this.parser.parse(activeFileLines);
        // todo: don't mutate that
        const newlyCompletedTasks = this.extractNewlyCompletedTasks(activeFileTree);

        if (newlyCompletedTasks.length === 0) {
            new Notice("No tasks to archive");
        } else {
            if (this.settings.archiveToSeparateFile) {
                const archiveFile = await this.getArchiveForFile(activeFile);
                const archiveLines = await this.readFile(archiveFile);
                const archiveTree = this.parser.parse(archiveLines);

                const archiveSection = this.getOrCreateArchiveSectionIn(archiveTree)
                this.archive(archiveSection, newlyCompletedTasks);

                this.writeToFile(archiveFile, archiveTree.stringify());
            } else {
                const archiveSection = this.getOrCreateArchiveSectionIn(activeFileTree);
                this.archive(archiveSection, newlyCompletedTasks);
            }

            this.writeToFile(activeFile, activeFileTree.stringify());
            new Notice(`Archived ${newlyCompletedTasks.length} tasks`);
        }
    }

    private async readFile(file: TFile) {
        if (file === null || file.extension !== "md") {
            new Notice("The archiver works only in markdown (.md) files!");
            return;
        }
        const fileContents = await this.vault.read(file);
        return fileContents.split("\n");
    }

    private writeToFile(file: TFile, lines: string[]) {
        this.vault.modify(file, lines.join("\n"));
    }

    private archive(archiveSection: Section, completedTasks: Block[]) {
        const archiveBlock = archiveSection.blockContent;
        this.appendCompletedTasks(archiveBlock, completedTasks);
        this.addNewLinesIfNeeded(archiveBlock);
    }

    private getOrCreateArchiveSectionIn(section: Section) {
        let archiveSection = section.children.find((s) =>
            this.archivePattern.test(s.text)
        );
        if (!archiveSection) {
            if (this.settings.addNewlinesAroundHeadings) {
                Archiver.ensureNewlineFor(section);
            }
            const heading = this.buildArchiveHeading();
            const rootBlock = new Block(null, 0, "root");
            archiveSection = new Section(heading, 1, rootBlock);
            section.append(archiveSection);
        }
        return archiveSection;
    }

    private static ensureNewlineFor(section: Section) {
        let lastSection = section;
        const childrenLength = section.children.length;
        if (childrenLength > 0) {
            lastSection = section.children[childrenLength - 1];
        }
        const blocksLength = lastSection.blockContent.children.length;
        if (blocksLength > 0) {
            const lastBlock = lastSection.blockContent.children[blocksLength - 1];
            // TODO: another needless null check
            if (lastBlock.text && lastBlock.text.trim().length !== 0) {
                // TODO: add an abstraction like appendText, appendListItem
                lastSection.blockContent.append(new Block("", 1, "text"));
            }
        }
    }

    private extractNewlyCompletedTasks(tree: Section) {
        // TODO: the AST should not leak details about bullets or heading tokens
        // TODO: duplicated regex
        const filter = {
            // TODO: another needless null test
            blockFilter: (block: Block) =>
                block.text !== null &&
                /^(?<listMarker>[-*]|\d+\.) \[x]/.test(block.text),
            sectionFilter: (section: Section) =>
                !this.archivePattern.test(section.text),
        };
        return tree.extractBlocksRecursively(filter);
    }

    appendCompletedTasks(contents: Block, newCompletedTasks: Block[]) {
        let parentBlock = contents;

        // TODO: cludge for newlines
        parentBlock.children = parentBlock.children.filter(
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

        // TODO: TreeWalker will make this obsolete
        const addIndentationRecursively = (block: Block) => {
            block.text = indentation + block.text;
            block.children.forEach(addIndentationRecursively);
        };

        newCompletedTasks.forEach((block) => {
            addIndentationRecursively(block);
            parentBlock.append(block);
        });
    }

    private async getArchiveForFile(activeFile: TFile) {
        const archiveFileName =
            this.settings.defaultArchiveFileName.replace("%", activeFile.basename) +
            ".md";

        let archiveFile = this.vault.getAbstractFileByPath(archiveFileName);
        if (!archiveFile) {
            try {
                archiveFile = await this.vault.create(archiveFileName, "");
            } catch (error) {
                new Notice(
                    `Unable to create an archive file with the name '${archiveFileName}'`
                );
            }
        }

        archiveFile = this.vault.getAbstractFileByPath(archiveFileName);
        if (!(archiveFile instanceof TFile)) {
            const message = `${archiveFileName} is not a valid file`;
            new Notice(message);
            throw new Error(message);
        }

        return archiveFile;
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
