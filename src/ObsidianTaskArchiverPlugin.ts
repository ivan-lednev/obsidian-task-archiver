import { MarkdownView, Notice, Plugin } from "obsidian";

import { ActiveFile, DiskFile, EditorFile } from "./ActiveFile";
import { ArchiverSettingTab } from "./ArchiverSettingTab";
import { DEFAULT_SETTINGS, Settings } from "./Settings";
import { Archiver } from "./features/Archiver";
import { DateTreeResolver } from "./features/DateTreeResolver";
import { ListToHeadingTransformer } from "./features/ListToHeadingTransformer";
import { TaskListSorter } from "./features/TaskListSorter";
import { TaskTester } from "./features/TaskTester";
import { BlockParser } from "./parser/BlockParser";
import { SectionParser } from "./parser/SectionParser";

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
    private archiver: Archiver;
    private taskListSorter: TaskListSorter;
    private listToHeadingTransformer: ListToHeadingTransformer;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new ArchiverSettingTab(this.app, this));

        this.initializeDependencies()

        this.addCommand({
            id: "archive-tasks",
            name: "Archive tasks in this file",
            checkCallback: this.createCheckCallbackForPreviewAndEditView((file) =>
                this.archiver.archiveShallowTasksInActiveFile(file)
            ),
        });
        this.addCommand({
            id: "archive-tasks-deeply",
            name: "Archive tasks including nested tasks in this file",
            checkCallback: this.createCheckCallbackForPreviewAndEditView((file) =>
                this.archiver.archiveDeepTasksInActiveFile(file)
            ),
        });
        this.addCommand({
            id: "delete-tasks",
            name: "Delete tasks in this file",
            checkCallback: this.createCheckCallbackForPreviewAndEditView((file) =>
                this.archiver.deleteTasksInActiveFile(file)
            ),
        });
        this.addCommand({
            id: "archive-heading-under-cursor",
            name: "Archive heading under cursor",
            editorCallback: (editor) => {
                this.archiver.archiveHeadingUnderCursor(editor);
            },
        });
        this.addCommand({
            id: "sort-tasks-in-list-under-cursor",
            name: "Sort tasks in list under cursor",
            editorCallback: (editor) => {
                this.taskListSorter.sortListUnderCursor(editor);
            },
        });
        this.addCommand({
            id: "turn-list-items-into-headings",
            name: "Turn list items at this level into headings",
            editorCallback: (editor) => {
                this.listToHeadingTransformer.turnListItemsIntoHeadings(editor);
            },
        });
    }

    async loadSettings() {
        this.settings = {
            ...DEFAULT_SETTINGS,
            ...(await this.loadData()),
            indentationSettings: {
                useTab: this.getConfig("useTab"),
                tabSize: this.getConfig("tabSize"),
            },
        };
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.initializeDependencies();
    }

    private initializeDependencies() {
        const parser = new SectionParser(
            new BlockParser(this.settings.indentationSettings)
        );
        const taskTester = new TaskTester(this.settings);
        const dateTreeResolver = new DateTreeResolver(this.settings);

        this.archiver = new Archiver(
            this.app.vault,
            this.app.workspace,
            parser,
            dateTreeResolver,
            taskTester,
            this.settings
        );
        this.taskListSorter = new TaskListSorter(parser, taskTester, this.settings);
        this.listToHeadingTransformer = new ListToHeadingTransformer(
            parser,
            this.settings
        );
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
