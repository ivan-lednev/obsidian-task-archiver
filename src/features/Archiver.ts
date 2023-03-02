import { Editor, TFile, Vault, Workspace } from "obsidian";

import { cloneDeep, dropRight, isEmpty } from "lodash";

import { DateTreeResolver } from "./DateTreeResolver";
import { PlaceholderResolver } from "./PlaceholderResolver";
import { TaskTester } from "./TaskTester";

import { ActiveFile, DiskFile, EditorFile } from "../ActiveFile";
import { Settings } from "../Settings";
import {
    addNewlinesToSection,
    buildHeadingPattern,
    buildIndentation,
    deepExtractBlocks,
    detectHeadingUnderCursor,
    detectListItemUnderCursor,
    findSectionRecursively,
    shallowExtractBlocks,
} from "../Util";
import { Block } from "../model/Block";
import { RootBlock } from "../model/RootBlock";
import { Section } from "../model/Section";
import { SectionParser } from "../parser/SectionParser";

export interface BlockExtractor {
    (root: Block, filter: BlockFilter): Block[];
}

interface BlockFilter {
    (block: Block): boolean;
}

interface SectionFilter {
    (section: Section): boolean;
}

interface TreeFilter {
    blockFilter: BlockFilter;
    sectionFilter: SectionFilter;
}

interface TreeEditorCallback {
    (tree: Section): void;
}

export class Archiver {
    private readonly taskFilter: TreeFilter;

    constructor(
        private readonly vault: Vault,
        private readonly workspace: Workspace,
        private readonly parser: SectionParser,
        private readonly dateTreeResolver: DateTreeResolver,
        private readonly taskTester: TaskTester,
        private readonly placeholderResolver: PlaceholderResolver,
        private readonly settings: Settings,
        private readonly archiveHeadingPattern: RegExp = buildHeadingPattern(
            settings.archiveHeading
        )
    ) {
        const blockFilter = (block: Block) =>
            settings.archiveAllCheckedTaskTypes
                ? this.taskTester.isCheckedTask(block.text)
                : this.taskTester.isCompletedTask(block.text);
        this.taskFilter = {
            blockFilter,
            sectionFilter: (section: Section) => !this.isArchive(section.text),
        };
    }

    async archiveShallowTasksInActiveFile(file: ActiveFile) {
        return await this.archiveTasksInActiveFile(file, shallowExtractBlocks);
    }

    async archiveDeepTasksInActiveFile(file: ActiveFile) {
        return await this.archiveTasksInActiveFile(file, deepExtractBlocks);
    }

    async archiveTaskUnderCursor(editor: Editor) {
        const thisTaskRange = detectListItemUnderCursor(editor);

        if (thisTaskRange === null) {
            return;
        }

        const thisTaskLines = editor.getRange(...thisTaskRange).split("\n");

        editor.replaceRange("", ...thisTaskRange);

        const parsedTaskRoot = this.parser.parse(thisTaskLines);
        const parsedTaskBlock = parsedTaskRoot.blockContent.children[0];
        // todo: tidy up
        parsedTaskBlock.text = this.completeTask(parsedTaskBlock.text);
        const activeFile = new EditorFile(editor);

        await this.archiveTasks([parsedTaskBlock], activeFile);

        const [thisTaskStart] = thisTaskRange;
        editor.setCursor(thisTaskStart);
    }

    private completeTask(task: string) {
        return task.replace("[ ]", "[x]");
    }

    private async archiveTasksInActiveFile(
        file: ActiveFile,
        extractor: BlockExtractor
    ) {
        let tasks = await this.extractTasksFromActiveFile(file, extractor);

        tasks = await this.archiveTasks(tasks, file);

        return isEmpty(tasks)
            ? "No tasks to archive"
            : `Archived ${tasks.length} tasks`;
    }

    // todo: move to its own class
    private applyReplacementRecursively(blocks: Block[]) {
        const { regex, replacement } = this.settings.textReplacement;
        const compiledRegex = new RegExp(regex);
        return blocks.map((originalBlock) => {
            const blockTextWithReplacement = originalBlock.text.replace(
                compiledRegex,
                replacement
            );
            const updatedBlock = cloneDeep(originalBlock);
            updatedBlock.text = blockTextWithReplacement;
            updatedBlock.children = this.applyReplacementRecursively(
                originalBlock.children
            );
            return updatedBlock;
        });
    }

    // todo: move to its own class
    private appendMetadata(blocks: Block[]) {
        const { metadata, dateFormat } =
            this.settings.additionalMetadataBeforeArchiving;

        return blocks.map((block) => {
            const updatedBlock = cloneDeep(block);

            const resolvedMetadata = this.placeholderResolver.resolvePlaceholders(
                metadata,
                dateFormat,
                block.parentSection.text
            );

            updatedBlock.text = `${block.text} ${resolvedMetadata}`;
            return updatedBlock;
        });
    }

    async deleteTasksInActiveFile(file: ActiveFile) {
        const tasks = await this.extractTasksFromActiveFile(file, shallowExtractBlocks);
        return isEmpty(tasks) ? "No tasks to delete" : `Deleted ${tasks.length} tasks`;
    }

    async archiveHeadingUnderCursor(editor: Editor) {
        const thisHeadingRange = detectHeadingUnderCursor(editor);
        if (thisHeadingRange === null) {
            return;
        }

        const thisHeadingLines = editor.getRange(...thisHeadingRange).split("\n");

        editor.replaceRange("", ...thisHeadingRange);

        const parsedHeadingRoot = this.parser.parse(thisHeadingLines);
        const parsedHeading = parsedHeadingRoot.children[0];
        const activeFile = new EditorFile(editor);

        await this.archiveSection(activeFile, parsedHeading);
    }

    private async archiveTasks(tasks: Block[], file: ActiveFile) {
        // todo: add Mapper/Pipe
        if (this.settings.textReplacement.applyReplacement) {
            tasks = this.applyReplacementRecursively(tasks);
        }
        if (this.settings.additionalMetadataBeforeArchiving.addMetadata) {
            tasks = this.appendMetadata(tasks);
        }

        const archiveFile = await this.getArchiveFile(file);

        await this.editFileTree(archiveFile, (tree: Section) =>
            this.archiveBlocksToRoot(tasks, tree)
        );

        return tasks;
    }

    private async getArchiveFile(activeFile: ActiveFile) {
        return this.settings.archiveToSeparateFile
            ? new DiskFile(await this.getOrCreateArchiveFile(), this.vault)
            : activeFile;
    }

    private async editFileTree(file: ActiveFile, cb: TreeEditorCallback) {
        const tree = this.parser.parse(await file.readLines());
        cb(tree);
        await file.writeLines(this.stringifyTree(tree));
    }

    private async extractTasksFromActiveFile(
        file: ActiveFile,
        extractor: BlockExtractor
    ) {
        let tasks: Block[] = [];
        await this.editFileTree(file, (tree) => {
            tasks = tree.extractBlocksRecursively(this.taskFilter, extractor);
        });
        return tasks;
    }

    private archiveBlocksToRoot(tasks: Block[], root: Section) {
        const archiveSection = this.getArchiveSectionFromRoot(root);
        this.dateTreeResolver.mergeNewBlocksWithDateTree(
            archiveSection.blockContent,
            tasks
        );
    }

    private getArchiveSectionFromRoot(section: Section) {
        const shouldArchiveToRoot = !this.settings.archiveUnderHeading;
        if (this.settings.archiveToSeparateFile && shouldArchiveToRoot) {
            return section;
        }

        const existingArchiveSection = findSectionRecursively(section, (section) =>
            this.archiveHeadingPattern.test(section.text)
        );
        if (existingArchiveSection) {
            return existingArchiveSection;
        }

        if (this.settings.addNewlinesAroundHeadings) {
            addNewlinesToSection(section);
        }
        const newArchiveSection = this.buildArchiveSection();
        section.appendChild(newArchiveSection);

        return newArchiveSection;
    }

    private buildArchiveSection() {
        return new Section(
            ` ${this.settings.archiveHeading}`,
            this.settings.archiveHeadingDepth,
            new RootBlock()
        );
    }

    private isArchive(line: string) {
        return this.archiveHeadingPattern.test(line);
    }

    private async getOrCreateArchiveFile() {
        const archiveFileName = this.buildArchiveFilePath();
        return await this.getOrCreateFile(archiveFileName);
    }

    private buildArchiveFilePath() {
        const { defaultArchiveFileName, dateFormat } = this.settings;
        const fileNameWithResolvedPlaceholders =
            this.placeholderResolver.resolvePlaceholders(
                defaultArchiveFileName,
                dateFormat
            );
        return `${fileNameWithResolvedPlaceholders}.md`;
    }

    private async getOrCreateFile(path: string) {
        let file = this.vault.getAbstractFileByPath(path);
        if (!file) {
            const pathSeparator = "/";
            const pathNodes = path.split(pathSeparator);
            const pathContainsFolders = pathNodes.length > 1;
            if (pathContainsFolders) {
                const folderPath = dropRight(pathNodes).join(pathSeparator);
                const existingFolder = this.vault.getAbstractFileByPath(folderPath);
                if (!existingFolder) {
                    await this.vault.createFolder(folderPath);
                }
            }
            file = await this.vault.create(path, "");
        }

        if (!(file instanceof TFile)) {
            throw new Error(`${path} is not a valid markdown file`);
        }

        return file;
    }

    private stringifyTree(tree: Section) {
        const indentation = buildIndentation(this.settings.indentationSettings);
        return tree.stringify(indentation);
    }

    private async archiveSection(activeFile: ActiveFile, section: Section) {
        const archiveFile = await this.getArchiveFile(activeFile);

        await this.editFileTree(archiveFile, (tree) => {
            const archiveSection = this.getArchiveSectionFromRoot(tree);
            const archiveHeadingLevel = archiveSection.tokenLevel;
            section.recalculateTokenLevels(archiveHeadingLevel + 1);
            archiveSection.appendChild(section);
        });
    }
}
