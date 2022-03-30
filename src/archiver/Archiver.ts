import { ArchiverSettings } from "./ArchiverSettings";
import escapeStringRegexp from "escape-string-regexp";
import { SectionParser } from "../parser/SectionParser";
import { Section } from "../model/Section";
import { Block } from "../model/Block";
import { Editor, TFile, Vault, Workspace } from "obsidian";
import { DateTreeResolver } from "./DateTreeResolver";
import { RootBlock } from "../model/RootBlock";
import { addNewlinesToSection, buildIndentation } from "../util";
import { ListBlock } from "../model/ListBlock";

export class Archiver {
    private readonly archiveHeadingPattern: RegExp;

    constructor(
        private readonly vault: Vault,
        private readonly workspace: Workspace,
        private readonly parser: SectionParser,
        private readonly dateTreeResolver: DateTreeResolver,
        private readonly settings: ArchiverSettings
    ) {
        this.archiveHeadingPattern = Archiver.buildArchiveHeadingPattern(
            settings.archiveHeading
        );
    }

    private static buildArchiveHeadingPattern(archiveHeading: string) {
        const escapedArchiveHeading = escapeStringRegexp(archiveHeading);
        return new RegExp(`^#{1,6}\\s+${escapedArchiveHeading}`);
    }

    async archiveTasksInActiveFile(editor: Editor) {
        const tasks = this.extractTasksFromActiveFile(editor);
        await this.archiveTasks(tasks);
        return tasks.length === 0
            ? "No tasks to archive"
            : `Archived ${tasks.length} tasks`;
    }

    private extractTasksFromActiveFile(editor: Editor) {
        const fileContents = editor.getValue();
        const activeFileTree = this.parser.parse(fileContents.split("\n"));
        const tasks = this.extractTasksFromTree(activeFileTree);
        editor.setValue(this.stringifyTree(activeFileTree));
        return tasks;
    }

    private async archiveTasks(tasks: Block[]) {
        const archiveFile = this.settings.archiveToSeparateFile
            ? await this.getArchiveFile()
            : this.getActiveFile();
        const archiveTree = await this.parseFile(archiveFile);
        this.archiveToRoot(tasks, archiveTree);
        await this.writeTreeToFile(archiveFile, archiveTree);
    }

    private getActiveFile() {
        return this.workspace.getActiveFile();
    }

    deleteTasksInActiveFile(editor: Editor) {
        const tasks = this.extractTasksFromActiveFile(editor);
        return tasks.length === 0
            ? "No tasks to delete"
            : `Deleted ${tasks.length} tasks`;
    }

    private archiveToRoot(tasks: Block[], root: Section) {
        const archiveSection = this.getArchiveSectionFromRoot(root);
        this.dateTreeResolver.mergeNewBlocksWithDateTree(
            archiveSection.blockContent,
            tasks
        );
    }

    private getArchiveSectionFromRoot(section: Section) {
        let archiveSection = section.children.find((s) =>
            this.archiveHeadingPattern.test(s.text)
        );
        if (!archiveSection) {
            if (this.settings.addNewlinesAroundHeadings) {
                addNewlinesToSection(section);
            }
            const heading = this.buildArchiveHeading();
            const rootBlock = new RootBlock();
            archiveSection = new Section(heading, rootBlock);
            section.appendChild(archiveSection);
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

    private extractTasksFromTree(tree: Section) {
        // TODO: the AST should not leak details about bullets or heading tokens
        const completedTaskPattern = /^(?:[-*]|\d+\.) \[x]/;
        const isCompletedTask = (block: Block) =>
            block instanceof ListBlock && completedTaskPattern.test(block.text);

        const isSectionAnythingExceptArchive = (section: Section) =>
            !this.archiveHeadingPattern.test(section.text);

        const filter = {
            blockFilter: isCompletedTask,
            sectionFilter: isSectionAnythingExceptArchive,
        };
        return tree.extractBlocksRecursively(filter);
    }

    private async getArchiveFile() {
        const archiveFileName = `${this.settings.defaultArchiveFileName.replace(
            "%",
            this.getActiveFile().basename
        )}.md`;

        let archiveFile =
            this.vault.getAbstractFileByPath(archiveFileName) ||
            (await this.createFile(archiveFileName));

        if (archiveFile instanceof TFile) {
            return archiveFile;
        }

        throw new Error(`${archiveFileName} is not a valid markdown file`);
    }

    private async createFile(name: string) {
        return await this.vault.create(name, "");
    }

    private async writeTreeToFile(file: TFile, tree: Section) {
        const treeLines = this.stringifyTree(tree);
        await this.vault.modify(file, treeLines);
    }

    private stringifyTree(tree: Section) {
        const indentation = buildIndentation(this.settings.indentationSettings);
        return tree.stringify(indentation).join("\n");
    }

    private buildArchiveHeading() {
        const headingToken = "#".repeat(this.settings.archiveHeadingDepth);
        return `${headingToken} ${this.settings.archiveHeading}`;
    }
}
