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

type TreeEditor = (tree: Section) => void;

export class Archiver {
    constructor(
        private readonly vault: Vault,
        private readonly workspace: Workspace,
        private readonly parser: SectionParser,
        private readonly dateTreeResolver: DateTreeResolver,
        private readonly settings: ArchiverSettings,
        private readonly archiveHeadingPattern: RegExp = buildHeadingPattern(
            settings.archiveHeading
        )
    ) {}

    async archiveTasksInActiveFile(editor: Editor) {
        const tasks = this.extractTasksFromActiveFile(editor);
        await this.archiveTasks(editor, tasks);
        return tasks.length === 0
            ? "No tasks to archive"
            : `Archived ${tasks.length} tasks`;
    }

    private extractTasksFromActiveFile(editor: Editor) {
        let tasks: Block[] = [];
        this.editActiveFileTree(editor, (tree) => {
            tasks = this.extractTasksFromTree(tree);
        });
        return tasks;
    }

    private editActiveFileTree(editor: Editor, treeEditor: TreeEditor) {
        const activeFileTree = this.parseActiveFile(editor);
        treeEditor(activeFileTree);
        editor.setValue(this.stringifyTree(activeFileTree));
    }

    private parseActiveFile(editor: Editor) {
        const fileContents = editor.getValue();
        return this.parser.parse(fileContents.split("\n"));
    }

    private async editFileTree(file: TFile, treeEditor: TreeEditor) {
        const tree = await this.parseFile(file);
        treeEditor(tree);
        await this.vault.modify(file, this.stringifyTree(tree));
    }

    private async archiveTasks(editor: Editor, tasks: Block[]) {
        const archiveCallback = (tree: Section) => this.archiveToRoot(tasks, tree);
        this.settings.archiveToSeparateFile
            ? this.editFileTree(await this.getArchiveFile(), archiveCallback)
            : this.editActiveFileTree(editor, archiveCallback);
    }

    deleteTasksInActiveFile(editor: Editor) {
        const tasks = this.extractTasksFromActiveFile(editor);
        return Promise.resolve(
            tasks.length === 0 ? "No tasks to delete" : `Deleted ${tasks.length} tasks`
        );
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
            this.workspace.getActiveFile().basename
        )}.md`;

        let archiveFile =
            this.vault.getAbstractFileByPath(archiveFileName) ||
            (await this.vault.create(archiveFileName, ""));

        if (archiveFile instanceof TFile) {
            return archiveFile;
        }

        throw new Error(`${archiveFileName} is not a valid markdown file`);
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

function buildHeadingPattern(heading: string) {
    const escapedArchiveHeading = escapeStringRegexp(heading);
    return new RegExp(`^#{1,6}\\s+${escapedArchiveHeading}`);
}
