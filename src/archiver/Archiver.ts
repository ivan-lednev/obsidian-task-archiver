import { ArchiverSettings } from "./ArchiverSettings";
import escapeStringRegexp from "escape-string-regexp";
import { SectionParser } from "../parser/SectionParser";
import { Section } from "../model/Section";
import { Block } from "../model/Block";
import { TFile, Vault, Workspace } from "obsidian";
import { DateTreeResolver } from "./DateTreeResolver";
import { RootBlock } from "../model/RootBlock";
import { addNewlinesToSection, buildIndentation } from "../util";
import { ListBlock } from "../model/ListBlock";
import { ActiveFile, DiskFile } from "./ActiveFile";

const completedTaskPattern = /^(?:[-*]|\d+\.) \[x]/;

type TreeEditorCallback = (tree: Section) => void;

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

    async archiveTasksInActiveFile(file: ActiveFile) {
        const tasks = await this.extractTasksFromActiveFile(file);
        const archiveFile = this.settings.archiveToSeparateFile
            ? new DiskFile(await this.getArchiveFile(), this.vault)
            : file;

        await this.editFileTree(archiveFile, (tree: Section) =>
            this.archiveToRoot(tasks, tree)
        );

        return tasks.length === 0
            ? "No tasks to archive"
            : `Archived ${tasks.length} tasks`;
    }

    async deleteTasksInActiveFile(file: ActiveFile) {
        const tasks = await this.extractTasksFromActiveFile(file);
        return tasks.length === 0
            ? "No tasks to delete"
            : `Deleted ${tasks.length} tasks`;
    }

    private async editFileTree(file: ActiveFile, cb: TreeEditorCallback) {
        const tree = this.parser.parse(await file.readLines());
        cb(tree);
        await file.writeLines(this.stringifyTree(tree));
    }

    private async extractTasksFromActiveFile(file: ActiveFile) {
        let tasks: Block[] = [];
        await this.editFileTree(file, (tree) => {
            tasks = this.extractTasksFromTree(tree);
        });
        return tasks;
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

    private extractTasksFromTree(tree: Section) {
        return tree.extractBlocksRecursively({
            blockFilter: (block: Block) =>
                block instanceof ListBlock && completedTaskPattern.test(block.text),
            sectionFilter: (section: Section) =>
                !this.archiveHeadingPattern.test(section.text),
        });
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
        return tree.stringify(indentation);
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
