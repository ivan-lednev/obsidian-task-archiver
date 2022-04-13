import { MarkdownView, Notice, Plugin } from "obsidian";
import { Archiver } from "src/archiver/Archiver";
import { Settings } from "./Settings";
import { ArchiverSettingTab } from "./ArchiverSettingTab";
import { SectionParser } from "./parser/SectionParser";
import { DateTreeResolver } from "./archiver/DateTreeResolver";
import { BlockParser } from "./parser/BlockParser";
import { ActiveFile, DiskFile, EditorFile } from "./ActiveFile";
import { Sorter } from "./Sorter";
import { ListToHeadingTransformer } from "./ListToHeadingTransformer";

const DEFAULT_SETTINGS: Settings = {
    archiveHeading: "Archived",
    archiveHeadingDepth: 1,
    weeklyNoteFormat: "YYYY-MM-[W]-w",
    useWeeks: true,
    dailyNoteFormat: "YYYY-MM-DD",
    useDays: false,
    addNewlinesAroundHeadings: true,
    archiveToSeparateFile: false,
    defaultArchiveFileName: "% (archive)",
    indentationSettings: {
        useTab: true,
        tabSize: 4,
    },
};

export default class ObsidianTaskArchiver extends Plugin {
    settings: Settings;
    private parser: SectionParser;
    private archiver: Archiver;
    private sorter: Sorter;
    private listToHeadingTransformer: ListToHeadingTransformer;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new ArchiverSettingTab(this.app, this));

        this.parser = new SectionParser(
            new BlockParser(this.settings.indentationSettings)
        );
        this.archiver = new Archiver(
            this.app.vault,
            this.app.workspace,
            this.parser,
            new DateTreeResolver(this.settings),
            this.settings
        );
        this.sorter = new Sorter(this.parser, this.settings);
        this.listToHeadingTransformer = new ListToHeadingTransformer(
            this.parser,
            this.settings
        );

        this.addCommand({
            id: "archive-tasks",
            name: "Archive tasks in this file",
            checkCallback: this.createCheckCallbackForPreviewAndEditView((file) =>
                this.archiver.archiveTasksInActiveFile(file)
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
                this.sorter.sortListUnderCursor(editor);
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
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData(), {
            indentationSettings: {
                useTab: this.getConfig("useTab"),
                tabSize: this.getConfig("tabSize"),
            },
        });
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private createCheckCallbackForPreviewAndEditView(
        callback: (activeFile: ActiveFile) => Promise<string>
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
        return (this.app.vault as any).getConfig(key);
    }
}

async function withNotice(cb: () => Promise<string>) {
    try {
        const message = await cb();
        new Notice(message);
    } catch (e) {
        new Notice(e);
    }
}
