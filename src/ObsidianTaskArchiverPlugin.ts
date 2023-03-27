import { MarkdownView, Notice, Plugin } from "obsidian";

import _ from "lodash";

import { ActiveFile, DiskFile, EditorFile } from "./ActiveFile";
import { DEFAULT_DATE_FORMAT, DEFAULT_WEEK_FORMAT } from "./Constants";
import { DEFAULT_SETTINGS, Settings } from "./Settings";
import { ArchiveFeature } from "./features/ArchiveFeature";
import { ListToHeadingFeature } from "./features/ListToHeadingFeature";
import { TaskListSortFeature } from "./features/TaskListSortFeature";
import { ListItemService } from "./services/ListItemService";
import { MetadataService } from "./services/MetadataService";
import { PlaceholderService } from "./services/PlaceholderService";
import { TaskTestingService } from "./services/TaskTestingService";
import { TextReplacementService } from "./services/TextReplacementService";
import { BlockParser } from "./services/parser/BlockParser";
import { SectionParser } from "./services/parser/SectionParser";
import { ArchiverSettingTab } from "./settings-ui/ArchiverSettingTab";

async function withNotice(cb: () => Promise<string>) {
    try {
        const message = await cb();
        // eslint-disable-next-line no-new
        new Notice(message);
    } catch (e) {
        // eslint-disable-next-line no-new
        new Notice(e);
    }
}

export default class ObsidianTaskArchiver extends Plugin {
    settings: Settings;
    private archiveFeature: ArchiveFeature;
    private taskListSortFeature: TaskListSortFeature;
    private listToHeadingFeature: ListToHeadingFeature;

    async onload() {
        await this.loadSettings();
        const { placeholderService } = this.initializeDependencies();
        this.addSettingTab(new ArchiverSettingTab(this.app, this, placeholderService));
        this.addCommands();
    }

    private addCommands() {
        this.addCommand({
            id: "archive-tasks",
            name: "Archive tasks in this file",
            checkCallback: this.createCheckCallbackForPreviewAndEditView((file) =>
                this.archiveFeature.archiveShallowTasksInActiveFile(file)
            ),
        });
        this.addCommand({
            id: "archive-tasks-deeply",
            name: "Archive tasks including nested tasks in this file",
            checkCallback: this.createCheckCallbackForPreviewAndEditView((file) =>
                this.archiveFeature.archiveDeepTasksInActiveFile(file)
            ),
        });
        this.addCommand({
            id: "delete-tasks",
            name: "Delete tasks in this file",
            checkCallback: this.createCheckCallbackForPreviewAndEditView((file) =>
                this.archiveFeature.deleteTasksInActiveFile(file)
            ),
        });
        this.addCommand({
            id: "archive-heading-under-cursor",
            name: "Archive heading under cursor",
            editorCallback: (editor) => {
                this.archiveFeature.archiveHeadingUnderCursor(editor);
            },
        });
        this.addCommand({
            id: "sort-tasks-in-list-under-cursor",
            name: "Sort tasks in list under cursor",
            editorCallback: (editor) => {
                this.taskListSortFeature.sortListUnderCursor(editor);
            },
        });
        this.addCommand({
            id: "turn-list-items-into-headings",
            name: "Turn list items at this level into headings",
            editorCallback: (editor) => {
                this.listToHeadingFeature.turnListItemsIntoHeadings(editor);
            },
        });

        this.addCommand({
            id: "toggle-done-and-archive",
            name: "Toggle task done and archive it",
            editorCallback: (editor) => {
                this.archiveFeature.archiveTaskUnderCursor(editor);
            },
        });
    }

    async loadSettings() {
        const userData: Settings = await this.loadData();
        const updatedUserData = this.replaceOldSettings(userData);

        this.settings = {
            ...DEFAULT_SETTINGS,
            ...updatedUserData,
            indentationSettings: {
                useTab: this.getConfig("useTab"),
                tabSize: this.getConfig("tabSize"),
            },
        };
    }

    private replaceOldSettings(settings: Settings) {
        const updated = { ...settings };

        if (updated.archiveHeading) {
            updated.headings = [{ text: updated.archiveHeading }];
            delete updated.archiveHeading;
        }

        if (updated.useWeeks) {
            updated.archiveUnderListItems = true;
            updated.listItems = [
                {
                    text: "[[{{date}}]]",
                    dateFormat: updated.weeklyNoteFormat || DEFAULT_WEEK_FORMAT,
                },
            ];

            delete updated.useWeeks;
            delete updated.weeklyNoteFormat;
        }

        if (updated.useDays) {
            updated.archiveUnderListItems = true;
            updated.listItems = [
                {
                    text: "[[{{date}}]]",
                    dateFormat: updated.dailyNoteFormat || DEFAULT_DATE_FORMAT,
                },
            ];

            delete updated.useDays;
            delete updated.dailyNoteFormat;
        }

        return updated;
    }

    async saveSettings(newSettings: Settings) {
        await this.saveData(newSettings);
        this.initializeDependencies();
    }

    private initializeDependencies() {
        const parser = new SectionParser(
            new BlockParser(this.settings.indentationSettings)
        );
        const taskTestingService = new TaskTestingService(this.settings);
        const placeholderService = new PlaceholderService(this.app.workspace);
        const listItemService = new ListItemService(placeholderService, this.settings);
        const textReplacementService = new TextReplacementService(this.settings);
        const metadataService = new MetadataService(placeholderService, this.settings);

        this.archiveFeature = new ArchiveFeature(
            this.app.vault,
            this.app.workspace,
            parser,
            listItemService,
            taskTestingService,
            placeholderService,
            textReplacementService,
            metadataService,
            this.settings
        );
        this.taskListSortFeature = new TaskListSortFeature(
            parser,
            taskTestingService,
            this.settings
        );
        this.listToHeadingFeature = new ListToHeadingFeature(parser, this.settings);

        return { placeholderService };
    }

    private createCheckCallbackForPreviewAndEditView(
        callback: (file: ActiveFile) => Promise<string>
    ) {
        return (checking: boolean) => {
            const activeMarkdownView =
                this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeMarkdownView) {
                if (!checking) {
                    const file = this.getFileViewForMarkdownView(activeMarkdownView);
                    withNotice(() => callback(file));
                }
                return true;
            }
            return false;
        };
    }

    private getFileViewForMarkdownView(activeMarkdownView: MarkdownView) {
        return activeMarkdownView.getMode() === "preview"
            ? new DiskFile(this.app.workspace.getActiveFile(), this.app.vault)
            : new EditorFile(activeMarkdownView.editor);
    }

    private getConfig(key: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.app.vault as any).getConfig(key);
    }
}
