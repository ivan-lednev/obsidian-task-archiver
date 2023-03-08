import { Editor, TFile, Vault, Workspace } from "obsidian";

import { dropRight, flow, isEmpty } from "lodash";
import { groupBy, map, mapValues, toPairs } from "lodash/fp";

import { ActiveFile, DiskFile, EditorFile } from "../ActiveFile";
import { Rule, Settings } from "../Settings";
import { Block } from "../model/Block";
import { RootBlock } from "../model/RootBlock";
import { Section } from "../model/Section";
import { DateTreeService } from "../services/DateTreeService";
import { MetadataService } from "../services/MetadataService";
import { PlaceholderService } from "../services/PlaceholderService";
import { TaskTestingService } from "../services/TaskTestingService";
import { TextReplacementService } from "../services/TextReplacementService";
import { SectionParser } from "../services/parser/SectionParser";
import {
    detectHeadingUnderCursor,
    detectListItemUnderCursor,
} from "../util/CodeMirrorUtil";
import {
    addNewlinesToSection,
    buildHeadingPattern,
    buildIndentation,
    deepExtractBlocks,
    extractBlocksRecursively,
    findSection,
    findSectionRecursively,
    shallowExtractBlocks,
} from "../util/Util";

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

export interface BlockWithRule {
    task: Block;
    rule?: Rule;
}

export class ArchiveFeature {
    private readonly taskFilter: TreeFilter;

    constructor(
        private readonly vault: Vault,
        private readonly workspace: Workspace,
        private readonly parser: SectionParser,
        private readonly dateTreeService: DateTreeService,
        private readonly taskTestingService: TaskTestingService,
        private readonly placeholderService: PlaceholderService,
        private readonly textReplacementService: TextReplacementService,
        private readonly metadataService: MetadataService,
        private readonly settings: Settings,
        private readonly archiveHeadingPattern: RegExp = buildHeadingPattern(
            settings.archiveHeading
        )
    ) {
        this.taskFilter = {
            blockFilter: (block: Block) =>
                this.taskTestingService.doesTaskNeedArchiving(block.text),
            sectionFilter: (section: Section) => !this.isArchive(section.text),
        };
    }

    async archiveShallowTasksInActiveFile(file: ActiveFile) {
        return await this.extractAndArchiveTasksInActiveFile(
            file,
            shallowExtractBlocks
        );
    }

    async archiveDeepTasksInActiveFile(file: ActiveFile) {
        return await this.extractAndArchiveTasksInActiveFile(file, deepExtractBlocks);
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

        await this.archiveTasks(
            [{ task: parsedTaskBlock, rule: this.getDefaultRule() }],
            activeFile
        );

        const [thisTaskStart] = thisTaskRange;
        editor.setCursor(thisTaskStart);
    }

    private completeTask(task: string) {
        return task.replace("[ ]", "[x]");
    }

    private getDefaultRule() {
        return {
            archiveToSeparateFile: this.settings.archiveToSeparateFile,
            defaultArchiveFileName: this.settings.defaultArchiveFileName,
            dateFormat: this.settings.additionalMetadataBeforeArchiving.dateFormat,
            statuses: "", // todo: this belongs to a separate object
        };
    }

    private async extractAndArchiveTasksInActiveFile(
        activeFile: ActiveFile,
        extractor: BlockExtractor
    ) {
        const tasks = (
            await this.extractTasksFromActiveFile(activeFile, extractor)
        ).map((task) => ({
            task,
            rule:
                this.settings.rules.find((rule) =>
                    rule.statuses.includes(this.getTaskStatus(task))
                ) || this.getDefaultRule(),
        }));

        await this.archiveTasks(tasks, activeFile);

        return isEmpty(tasks)
            ? "No tasks to archive"
            : `Archived ${tasks.length} tasks`;
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

    private async archiveTasks(tasks: BlockWithRule[], activeFile: ActiveFile) {
        await flow(
            map(({ rule, task }) => ({
                rule,
                task: this.textReplacementService.replaceText(task),
            })),
            map((taskWithRule) => this.metadataService.appendMetadata(taskWithRule)),
            map(({ rule, task }: BlockWithRule) => ({
                task,
                archivePath: rule.archiveToSeparateFile
                    ? this.placeholderService.resolve(
                          rule.defaultArchiveFileName,
                          rule.dateFormat
                      )
                    : "current-file",
            })),
            groupBy((task) => task.archivePath),
            mapValues((tasks) => tasks.map(({ task }) => task)),
            toPairs,
            map(async ([archivePath, tasks]) => {
                const archiveFile =
                    archivePath === "current-file"
                        ? activeFile
                        : await this.getDiskFile(archivePath); // todo: this may be an issue if the rule says to archive a task to this exact file

                await this.editFileTree(archiveFile, (tree: Section) =>
                    this.archiveBlocksToRoot(tasks, tree)
                );
            }),
            (promises) => Promise.all(promises)
        )(tasks);
    }

    // todo: move to parsing
    private getTaskStatus(task: Block) {
        const [, taskStatus] = task.text.match(/\[(.)]/);
        return taskStatus;
    }

    private async getArchiveFile(activeFile: ActiveFile) {
        if (!this.settings.archiveToSeparateFile) {
            return activeFile;
        }

        return this.getDiskFileByPathWithPlaceholders(
            this.settings.defaultArchiveFileName
        );
    }

    private async getDiskFileByPathWithPlaceholders(path: string) {
        return this.getDiskFile(
            this.placeholderService.resolve(path, this.settings.dateFormat)
        );
    }

    private async getDiskFile(path: string) {
        const tFile = await this.getOrCreateFile(`${path}.md`);
        return new DiskFile(tFile, this.vault);
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
        await this.editFileTree(file, (root) => {
            tasks = extractBlocksRecursively(root, {
                filter: this.taskFilter,
                extractor,
            });
        });
        return tasks;
    }

    private archiveBlocksToRoot(tasks: Block[], root: Section) {
        const archiveSection = this.getArchiveSectionFromRoot(root);
        this.dateTreeService.mergeNewBlocksWithDateTree(
            archiveSection.blockContent,
            tasks
        );
    }

    private getArchiveSectionFromRoot(root: Section) {
        const shouldArchiveToRoot = !this.settings.archiveUnderHeading;
        if (this.settings.archiveToSeparateFile && shouldArchiveToRoot) {
            return root;
        }

        const { headings } = this.settings;
        if (headings.length > 0) {
            // special handling
            let context = root;

            for (let i = 0; i < headings.length; i++) {
                const headingTextToSearchFor = headings[i];
                const existingHeading = findSection(
                    context,
                    (section) => section.text === headingTextToSearchFor
                );

                if (existingHeading === null) {
                    const tokenLevel = i + 1;
                    const newSection = new Section(
                        // todo: it's lame that we have to manage spaces manually
                        " " + headingTextToSearchFor,
                        tokenLevel,
                        new RootBlock()
                    );
                    context.appendChild(newSection);
                    context = newSection;
                } else {
                    context = existingHeading;
                }
            }

            // our new section
            return context;
        }

        const existingArchiveSection = findSectionRecursively(root, (section) =>
            this.archiveHeadingPattern.test(section.text)
        );
        if (existingArchiveSection) {
            return existingArchiveSection;
        }

        if (this.settings.addNewlinesAroundHeadings) {
            addNewlinesToSection(root);
        }
        const newArchiveSection = this.buildArchiveSection();
        root.appendChild(newArchiveSection);

        return newArchiveSection;
    }

    private buildArchiveSection() {
        return new Section(
            ` ${this.settings.archiveHeading}`,
            this.settings.archiveHeadingDepth,
            new RootBlock()
        );
    }

    // todo: this is out of place
    private isArchive(line: string) {
        return this.archiveHeadingPattern.test(line);
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
