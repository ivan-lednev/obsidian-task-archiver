import { Notice, Plugin, TFile } from "obsidian";
import { Archiver } from "src/archiver/Archiver";
import { ArchiverSettings } from "./archiver/ArchiverSettings";
import { ArchiverSettingTab } from "./ArchiverSettingTab";
import { DefaultSettings } from "./defaultSettings";
import { SectionParser } from "./parser/SectionParser";
import { DateTreeResolver } from "./archiver/DateTreeResolver";
import { BlockParser } from "./parser/BlockParser";

export default class ObsidianTaskArchiver extends Plugin {
    settings: ArchiverSettings;
    private archiver: Archiver;

    async onload() {
        // TODO: why did I break plugin initialization?
        await this.loadSettings();
        this.addSettingTab(new ArchiverSettingTab(this.app, this));

        this.addCommand({
            id: "archive-tasks",
            name: "Archive tasks in this file",
            callback: () => this.archiveTaskInActiveFile(),
        });
        this.addCommand({
            id: "delete-tasks",
            name: "Delete completed top-level tasks in this file",
            callback: () => this.deleteTasksInActiveFile(),
        });

        this.archiver = new Archiver(
            this.app.vault,
            this.app.workspace,
            new SectionParser(new BlockParser(this.settings.indentationSettings)),
            new DateTreeResolver(this.settings),
            this.settings
        );
    }

    private async archiveTaskInActiveFile() {
        try {
            const message = await this.archiver.archiveTasksInActiveFile();
            new Notice(message);
        } catch (e) {
            new Notice(e);
        }
    }

    private async deleteTasksInActiveFile() {
        // TODO: remove duplication in try-catch
        try {
            const message = await this.archiver.deleteTasksInActiveFile();
            new Notice(message);
        } catch (e) {
            new Notice(e);
        }
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
