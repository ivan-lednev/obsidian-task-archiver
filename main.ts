import {
    App,
    Plugin,
    PluginSettingTab,
    Setting,
    ToggleComponent,
} from "obsidian";
import { Archiver } from "src/archiver";

export interface ArchiverSettings {
    weeklyNoteFormat: string;
    useDateTree: boolean;
}

export const DEFAULT_SETTINGS: ArchiverSettings = {
    weeklyNoteFormat: "YYYY-MM-[W]-w",
    useDateTree: true,
};

export default class ObsidianTaskArchiver extends Plugin {
    settings: ArchiverSettings;
    async onload() {
        this.addCommand({
            id: "archive-tasks",
            name: "Archive tasks in this file",
            callback: () => this.archiveTasksInCurrentFile(),
        });

        await this.loadSettings();

        this.addSettingTab(new ArchiverSettingTab(this.app, this));
    }

    private async archiveTasksInCurrentFile() {
        const activeFile = this.app.workspace.getActiveFile();
        const fileContents = await this.app.vault.read(activeFile);
        const lines = fileContents.split("\n");
        const linesWithInsertedArchivedTasks = new Archiver(
            this.settings
        ).archiveTasks(lines);

        this.app.vault.modify(
            activeFile,
            linesWithInsertedArchivedTasks.join("\n")
        );
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class ArchiverSettingTab extends PluginSettingTab {
    plugin: ObsidianTaskArchiver;
    constructor(app: App, plugin: ObsidianTaskArchiver) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl("h2", { text: "Obsidian Task Archiver Settings" });

        new Setting(containerEl)
            .setName("Use date trees")
            .setDesc("Add completed tasks under a link to the current week")
            .addToggle((toggleComponent) =>
                toggleComponent.onChange(async (value) => {
                    this.plugin.settings.useDateTree = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setDisabled(!this.plugin.settings.useDateTree)
            .setName("Weekly note pattern")
            .setDesc("Weekly note pattern")
            .addMomentFormat((momentFormatComponent) => {
                momentFormatComponent
                    .setDefaultFormat("YYYY-MM-[W]-w")
                    .setValue(this.plugin.settings.weeklyNoteFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.weeklyNoteFormat = value;
                        await this.plugin.saveSettings();
                    });
            });
    }
}
