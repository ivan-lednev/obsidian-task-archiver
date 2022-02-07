import { ArchiverSettings } from "./ArchiverSettings";
import escapeStringRegexp from "escape-string-regexp";
import { SectionParser } from "../parser/SectionParser";
import { Section } from "../model/Section";
import { Block } from "../model/Block";
import { TFile, Vault, Workspace } from "obsidian";
import { DateTreeResolver } from "./DateTreeResolver";

export class Archiver {
    private readonly settings: ArchiverSettings;
    private readonly archiveHeadingPattern: RegExp;
    private readonly parser: SectionParser;
    private readonly workspace: Workspace;
    private readonly vault: Vault;
    private readonly dateTreeResolver: DateTreeResolver;

    constructor(
        vault: Vault,
        workspace: Workspace,
        parser: SectionParser,
        dateTreeResolver: DateTreeResolver,
        settings: ArchiverSettings
    ) {
        this.vault = vault;
        this.workspace = workspace;
        this.parser = parser;
        this.dateTreeResolver = dateTreeResolver;
        this.settings = settings;
        this.archiveHeadingPattern = Archiver.buildArchiveHeadingPattern(
            settings.archiveHeading
        );
    }

    private static buildArchiveHeadingPattern(archiveHeading: string) {
        const escapedArchiveHeading = escapeStringRegexp(archiveHeading);
        return new RegExp(`^#{1,6}\\s+${escapedArchiveHeading}`);
    }

    private static addNewlinesIfNeeded(section: Section) {
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

    async archiveTasksInActiveFile() {
        const activeFile = this.workspace.getActiveFile();
        const activeFileTree = await this.parseFile(activeFile);
        const newlyCompletedTasks = this.extractNewlyCompletedTasks(activeFileTree);

        if (newlyCompletedTasks.length === 0) {
            return "No tasks to archive";
        }

        if (this.settings.archiveToSeparateFile) {
            const archiveFile = await this.getArchiveForFile(activeFile);
            const archiveTree = await this.parseFile(archiveFile);

            this.archiveToRootSection(newlyCompletedTasks, archiveTree);
            await this.writeToFile(archiveFile, archiveTree.stringify());
        } else {
            this.archiveToRootSection(newlyCompletedTasks, activeFileTree);
        }

        await this.writeToFile(activeFile, activeFileTree.stringify());
        return `Archived ${newlyCompletedTasks.length} tasks`;
    }

    private archiveToRootSection(newlyCompletedTasks: Block[], root: Section) {
        const archiveSection = this.getArchiveSection(root);
        this.archiveToSection(newlyCompletedTasks, archiveSection);
    }

    private getArchiveSection(section: Section) {
        let archiveSection = section.children.find((s) =>
            this.archiveHeadingPattern.test(s.text)
        );
        if (!archiveSection) {
            if (this.settings.addNewlinesAroundHeadings) {
                Archiver.addNewlinesIfNeeded(section);
            }
            const heading = this.buildArchiveHeading();
            const rootBlock = new Block(null, 0, "root");
            archiveSection = new Section(heading, 1, rootBlock);
            section.append(archiveSection);
        }
        return archiveSection;
    }

    private async parseFile(file: TFile) {
        if (file === null || file.extension !== "md") {
            throw new Error("The archiver works only in markdown (.md) files!");
        }
        const fileContents = await this.vault.read(file);
        return this.parser.parse(fileContents.split("\n"));
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
                !this.archiveHeadingPattern.test(section.text),
        };
        return tree.extractBlocksRecursively(filter);
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
                throw new Error(
                    `Unable to create an archive file with the name '${archiveFileName}'`
                );
            }
        }

        archiveFile = this.vault.getAbstractFileByPath(archiveFileName);
        if (!(archiveFile instanceof TFile)) {
            throw new Error(`${archiveFileName} is not a valid markdown file`);
        }

        return archiveFile;
    }

    private async writeToFile(file: TFile, lines: string[]) {
        await this.vault.modify(file, lines.join("\n"));
    }

    private archiveToSection(completedTasks: Block[], archiveSection: Section) {
        const archiveBlock = archiveSection.blockContent;
        // todo: no mutation?
        this.dateTreeResolver.mergeBlocksWithTree(archiveBlock, completedTasks);
        this.addNewLinesIfNeeded(archiveBlock);
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
