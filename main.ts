import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { Archiver } from "src/Archiver";
import { ArchiverSettings } from "./src/ArchiverSettings";

const DEFAULT_SETTINGS: ArchiverSettings = {
    archiveHeading: "Archived",
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
            .setName("Archive heading")
            .setDesc("A heading with this text will be used as an archive")
            .addText((textComponent) => {
                textComponent
                    .setPlaceholder(this.plugin.settings.archiveHeading)
                    .setValue(this.plugin.settings.archiveHeading)
                    .onChange(async (value) => {
                        this.plugin.settings.archiveHeading = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName("Use date trees")
            .setDesc("Add completed tasks under a link to the current week")
            .addToggle((toggleComponent) =>
                toggleComponent
                    .setValue(this.plugin.settings.useDateTree)
                    .onChange(async (value) => {
                        this.plugin.settings.useDateTree = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setDisabled(!this.plugin.settings.useDateTree)
            .setName("Weekly note pattern")
            .then((setting) => {
                setting.addMomentFormat((momentFormat) => {
                    setting.descEl.appendChild(
                        createFragment((fragment) => {
                            fragment.appendText("For more syntax, refer to ");
                            fragment.createEl(
                                "a",
                                {
                                    text: "format reference",
                                    href: "https://momentjs.com/docs/#/displaying/format/",
                                },
                                (a) => {
                                    a.setAttr("target", "_blank");
                                }
                            );
                            fragment.createEl("br");
                            fragment.appendText(
                                "Your current syntax looks like this: "
                            );
                            momentFormat.setSampleEl(fragment.createEl("b"));
                            fragment.createEl("br");
                        })
                    );

                    momentFormat
                        .setDefaultFormat(this.plugin.settings.weeklyNoteFormat)
                        .setPlaceholder(this.plugin.settings.weeklyNoteFormat)
                        .setValue(this.plugin.settings.weeklyNoteFormat)
                        .onChange(async (value) => {
                            this.plugin.settings.weeklyNoteFormat = value;
                            await this.plugin.saveSettings();
                        });
                });
            });
    }
}
