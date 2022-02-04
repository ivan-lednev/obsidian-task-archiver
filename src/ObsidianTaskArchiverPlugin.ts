import { Notice, Plugin, TFile } from "obsidian";
import { Archiver } from "src/archiver/Archiver";
import { ArchiverSettings } from "./archiver/ArchiverSettings";
import { ArchiverSettingTab } from "./ArchiverSettingTab";
import { DefaultSettings } from "./defaultSettings";

export default class ObsidianTaskArchiver extends Plugin {
    settings: ArchiverSettings;

    async onload() {
        this.addCommand({
            id: "archive-tasks",
            name: "Archive tasks in this file",
            callback: () => this.archiveTaskInActiveFile(),
        });
        await this.loadSettings();
        this.addSettingTab(new ArchiverSettingTab(this.app, this));
    }

    private async archiveTaskInActiveFile() {
        const archiver = new Archiver(
            this.app.vault,
            this.app.workspace,
            this.settings
        );
        await archiver.archiveTasksInActiveFile();
    }

    async loadSettings() {
        const getConfig = (key: string) => {
            return (this.app.vault as any).getConfig(key);
        };

        this.settings = Object.assign({}, DefaultSettings, await this.loadData(), {
            indentationSettings: {
                useTab: getConfig("useTab"),
                tabSize: getConfig("tabSize"),
            },
        });
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
