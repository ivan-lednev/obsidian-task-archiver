import { MarkdownView, Notice, Plugin } from "obsidian";
import { Archiver} from "src/archiver/Archiver";
import { ArchiverSettings } from "./archiver/ArchiverSettings";
import { ArchiverSettingTab } from "./ArchiverSettingTab";
import { DefaultSettings } from "./defaultSettings";
import { SectionParser } from "./parser/SectionParser";
import { DateTreeResolver } from "./archiver/DateTreeResolver";
import { BlockParser } from "./parser/BlockParser";
import {ActiveFile, DiskFile, EditorFile} from "./archiver/ActiveFile";

export default class ObsidianTaskArchiver extends Plugin {
    settings: ArchiverSettings;
    private archiver: Archiver;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new ArchiverSettingTab(this.app, this));

        this.addCommand({
            id: "archive-tasks",
            name: "Archive tasks in this file",
            checkCallback: this.createCheckCallback((file) =>
                this.archiver.archiveTasksInActiveFile(file)
            ),
        });
        this.addCommand({
            id: "delete-tasks",
            name: "Delete tasks in this file",
            checkCallback: this.createCheckCallback((file) =>
                this.archiver.deleteTasksInActiveFile(file)
            ),
        });

        this.archiver = new Archiver(
            this.app.vault,
            this.app.workspace,
            new SectionParser(new BlockParser(this.settings.indentationSettings)),
            new DateTreeResolver(this.settings),
            this.settings
        );
    }

    private createCheckCallback(callback: (activeFile: ActiveFile) => Promise<string>) {
        return (checking: boolean) => {
            const activeMarkdownView =
                this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeMarkdownView) {
                if (!checking) {
                    const file =
                        activeMarkdownView.getMode() === "preview"
                            ? new DiskFile(
                                  this.app.workspace.getActiveFile(),
                                  this.app.vault
                              )
                            : new EditorFile(activeMarkdownView.editor);
                    // noinspection JSIgnoredPromiseFromCall
                    withNotice(() => callback(file));
                }
                return true;
            }
        };
    }

    async loadSettings() {
        this.settings = Object.assign({}, DefaultSettings, await this.loadData(), {
            indentationSettings: {
                useTab: this.getConfig("useTab"),
                tabSize: this.getConfig("tabSize"),
            },
        });
    }

    private async getConfig(key: string) {
        return (this.app.vault as any).getConfig(key);
    }

    async saveSettings() {
        await this.saveData(this.settings);
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
