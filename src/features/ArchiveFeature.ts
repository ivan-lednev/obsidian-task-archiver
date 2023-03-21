import { Editor, TFile, Vault, Workspace } from "obsidian";

import { dropRight, flow, groupBy, isEmpty, map, orderBy, toPairs } from "lodash/fp";

import { ActiveFile, DiskFile, EditorFile } from "../ActiveFile";
import { DEFAULT_DATE_FORMAT } from "../Constants";
import { Settings, TaskSortOrder, TreeLevelConfig } from "../Settings";
import { Block } from "../model/Block";
import { RootBlock } from "../model/RootBlock";
import { Section } from "../model/Section";
import { ListItemService } from "../services/ListItemService";
import { MetadataService } from "../services/MetadataService";
import { PlaceholderService } from "../services/PlaceholderService";
import { TaskTestingService } from "../services/TaskTestingService";
import { TextReplacementService } from "../services/TextReplacementService";
import { SectionParser } from "../services/parser/SectionParser";
import {
    BlockExtractor,
    BlockWithRule,
    TreeEditorCallback,
    TreeFilter,
} from "../types/Types";
import {
    detectHeadingUnderCursor,
    detectListItemUnderCursor,
} from "../util/CodeMirrorUtil";
import {
    addNewlinesToSection,
    buildIndentation,
    deepExtractBlocks,
    extractBlocksRecursively,
    findSectionRecursively,
    getTaskCompletionDate,
    shallowExtractBlocks,
} from "../util/Util";

// todo: move to parsing
function getTaskStatus(task: Block) {
    const [, taskStatus] = task.text.match(/\[(.)]/);
    return taskStatus;
}

function completeTask(task: string) {
    return task.replace("[ ]", "[x]");
}

export class ArchiveFeature {
    private readonly taskFilter: TreeFilter;

    constructor(
        private readonly vault: Vault,
        private readonly workspace: Workspace,
        private readonly parser: SectionParser,
        private readonly listItemService: ListItemService,
        private readonly taskTestingService: TaskTestingService,
        private readonly placeholderService: PlaceholderService,
        private readonly textReplacementService: TextReplacementService,
        private readonly metadataService: MetadataService,
        private readonly settings: Settings,
        /** @deprecated */
        private readonly archiveHeadingPattern = settings.archiveHeading
    ) {
        this.taskFilter = {
            blockFilter: (block: Block) =>
                this.taskTestingService.doesTaskNeedArchiving(block.text),
            sectionFilter: (section: Section) =>
                !this.isTopArchiveHeading(section.text),
        };
    }

    async archiveShallowTasksInActiveFile(file: ActiveFile) {
        return this.extractAndArchiveTasksInActiveFile(file, shallowExtractBlocks);
    }

    async archiveDeepTasksInActiveFile(file: ActiveFile) {
        return this.extractAndArchiveTasksInActiveFile(file, deepExtractBlocks);
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
        parsedTaskBlock.text = completeTask(parsedTaskBlock.text);
        const activeFile = new EditorFile(editor);

        await this.archiveTasks(
            [{ task: parsedTaskBlock, rule: this.getDefaultRule() }],
            activeFile
        );

        const [thisTaskStart] = thisTaskRange;
        editor.setCursor(thisTaskStart);
    }

    private getDefaultRule() {
        return {
            archiveToSeparateFile: this.settings.archiveToSeparateFile,
            defaultArchiveFileName: this.settings.defaultArchiveFileName,
            dateFormat: this.settings.additionalMetadataBeforeArchiving.dateFormat,
            obsidianTasksCompletedDateFormat: DEFAULT_DATE_FORMAT,
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
                    rule.statuses.includes(getTaskStatus(task))
                ) || this.getDefaultRule(),
        })); // todo: we can push this into the 'archiveTasks' flow

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
        const sortOrder =
            this.settings.taskSortOrder === TaskSortOrder.NEWEST_LAST ? "asc" : "desc";

        await flow(
            orderBy(({ task: { text } }) => getTaskCompletionDate(text), sortOrder),
            map(
                flow(
                    ({ rule, task }: BlockWithRule) => ({
                        rule,
                        task: this.textReplacementService.replaceText(task),
                    }),
                    this.metadataService.appendMetadata,
                    // todo: we don't need rules up until this point
                    ({ rule, task }: BlockWithRule) => {
                        const archivePath = rule.archiveToSeparateFile
                            ? rule.defaultArchiveFileName
                            : "current-file";

                        const resolvedPath = this.placeholderService.resolve(
                            archivePath,
                            {
                                dateFormat: rule.dateFormat,
                                block: task,
                                obsidianTasksCompletedDateFormat:
                                    this.settings.obsidianTasksCompletedDateFormat,
                            }
                        );

                        const resolveWithTask = map(
                            ({
                                text,
                                dateFormat,
                                obsidianTasksCompletedDateFormat,
                            }: TreeLevelConfig) =>
                                this.placeholderService.resolve(text, {
                                    dateFormat,
                                    obsidianTasksCompletedDateFormat,
                                    block: task,
                                })
                        );

                        return {
                            task,
                            resolvedPath,
                            resolvedHeadings: resolveWithTask(this.settings.headings),
                            resolvedListItems: resolveWithTask(this.settings.listItems),
                        };
                    }
                )
            ),
            groupBy((task) => task.resolvedPath),
            toPairs,
            map(async ([resolvedPath, tasksForPath]) => {
                const archiveFile =
                    resolvedPath === "current-file"
                        ? activeFile
                        : await this.getDiskFile(resolvedPath); // todo: this may be an issue if the rule says to archive a task to this exact file

                await this.editFileTree(archiveFile, (tree: Section) => {
                    for (const {
                        task,
                        resolvedHeadings,
                        resolvedListItems,
                    } of tasksForPath) {
                        this.archiveBlocksToRoot(
                            [task],
                            tree,
                            resolvedHeadings,
                            resolvedListItems
                        );
                    }
                });
            }),
            (promises) => Promise.all(promises)
        )(tasks);
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
            this.placeholderService.resolve(path, {
                dateFormat: this.settings.dateFormat,
            })
        );
    }

    private async getDiskFile(path: string) {
        const tFile = await this.getOrCreateFile(`${path}.md`);
        return new DiskFile(tFile, this.vault);
    }

    private async editFileTree(file: ActiveFile, cb: TreeEditorCallback) {
        const tree = this.parser.parse(await file.readLines());
        // todo: mutation
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

    private archiveBlocksToRoot(
        tasks: Block[],
        root: Section,
        resolvedHeadings: string[],
        resolvedListItems: string[]
    ) {
        const archiveSection = this.getArchiveSectionFromRoot(root, resolvedHeadings);
        this.listItemService.mergeBlocksWithListItemTree(
            archiveSection.blockContent,
            tasks,
            resolvedListItems
        );
    }

    private getArchiveSectionFromRoot(root: Section, resolvedHeadings?: string[]) {
        // todo: this might no longer be needed
        const shouldArchiveToRoot = !this.settings.archiveUnderHeading;
        if (this.settings.archiveToSeparateFile && shouldArchiveToRoot) {
            return root;
        }

        const { headings } = this.settings;

        if (headings.length === 0) {
            return root;
        }

        if (!resolvedHeadings) {
            resolvedHeadings = headings.map((heading) => {
                const { dateFormat } = heading;
                return this.placeholderService.resolve(heading.text, { dateFormat });
            });
        }

        if (this.settings.addNewlinesAroundHeadings) {
            addNewlinesToSection(root);
        }

        return this.findOrCreateArchiveLeaf(root, resolvedHeadings);
    }

    private findOrCreateArchiveLeaf(root: Section, resolvedHeadings: string[]) {
        let context = root;

        for (
            let headingIndex = 0;
            headingIndex < resolvedHeadings.length;
            headingIndex += 1
        ) {
            const headingTextToSearchFor = resolvedHeadings[headingIndex];
            const existingHeading = findSectionRecursively(
                context,
                (section) => section.text.trim() === headingTextToSearchFor // todo: no need for trim
            );

            if (existingHeading === null) {
                const tokenLevel = headingIndex + this.settings.archiveHeadingDepth;
                const newSection = new Section(
                    ` ${headingTextToSearchFor}`, // todo: do not manage spaces manually
                    tokenLevel,
                    new RootBlock()
                );

                context.appendChild(newSection);
                context = newSection;
            } else {
                context = existingHeading;
            }
        }

        return context;
    }

    private buildArchiveSection() {
        return new Section(
            ` ${this.settings.archiveHeading}`,
            this.settings.archiveHeadingDepth,
            new RootBlock()
        );
    }

    // todo: this is out of place
    private isTopArchiveHeading(line: string) {
        const firstHeading = this.settings.headings[0];
        if (firstHeading) {
            const resolvedHeadingText = this.placeholderService.resolve(
                firstHeading.text,
                { dateFormat: firstHeading.dateFormat }
            );
            // todo: this is defective; there should be a full match
            if (line.includes(resolvedHeadingText)) {
                return true;
            }
        }
        return false;
    }

    private async getOrCreateFile(path: string) {
        let file = this.vault.getAbstractFileByPath(path);
        if (!file) {
            const pathSeparator = "/";
            const pathNodes = path.split(pathSeparator);
            const pathContainsFolders = pathNodes.length > 1;
            if (pathContainsFolders) {
                const folderPath = dropRight(1, pathNodes).join(pathSeparator);
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
