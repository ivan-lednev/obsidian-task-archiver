import {
    App,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    TFile,
} from "obsidian";
import { Archiver } from "src/Archiver";
import { ArchiverSettings } from "./ArchiverSettings";

const DEFAULT_SETTINGS: ArchiverSettings = {
    archiveHeading: "Archived",
    archiveHeadingDepth: 1,
    weeklyNoteFormat: "YYYY-MM-[W]-w",
    useWeeks: true,
    dailyNoteFormat: "YYYY-MM-DD",
    useDays: false,
    addNewlinesAroundHeadings: true,
    indentationSettings: {
        useTab: true,
        tabSize: 4,
    },
    archiveToSeparateFile: false,
    defaultArchiveFileName: "% (archive)",
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
        if (activeFile === null || activeFile.extension !== "md") {
            new Notice("The archiver works only in markdown (.md) files!");
            return;
        }
        const activeFileContents = await this.app.vault.read(activeFile);
        const activeFileLines = activeFileContents.split("\n");

        const archiver = new Archiver(this.settings);

        if (this.settings.archiveToSeparateFile) {
            const archiveFileHandle = await this.getArchiveFileHandle(
                activeFile
            );
            const archiveFileContents = await this.app.vault.read(
                archiveFileHandle
            );
            const archiveFileLines = archiveFileContents.split("\n");

            const archiveResult = archiver.archiveTasksToSeparateFile(
                activeFileLines,
                archiveFileLines
            );
            new Notice(archiveResult.summary);

            this.app.vault.modify(activeFile, archiveResult.lines.join("\n"));
            this.app.vault.modify(
                archiveFileHandle,
                archiveResult.archiveLines.join("\n")
            );
        } else {
            const archiveResult = archiver.archiveTasks(activeFileLines);
            new Notice(archiveResult.summary);
            this.app.vault.modify(activeFile, archiveResult.lines.join("\n"));
        }
    }

    private async getArchiveFileHandle(activeFile: TFile) {
        const archiveFileName =
            this.settings.defaultArchiveFileName.replace(
                "%",
                activeFile.basename
            ) + ".md";
        // TODO: archiving to a folder will happen here
        const archiveExists = await this.app.vault.adapter.exists(
            archiveFileName
        );

        if (!archiveExists) {
            try {
                await this.app.vault.create(archiveFileName, "");
            } catch (error) {
                console.error(
                    `Unable to create an archive file with the name '${archiveFileName}'`
                );
            }
        }

        return this.app.vault.getAbstractFileByPath(archiveFileName) as TFile;
    }

    async loadSettings() {
        const getConfig = (key: string) => {
            return (this.app.vault as any).getConfig(key);
        };

        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData(),
            {
                indentationSettings: {
                    useTab: getConfig("useTab"),
                    tabSize: getConfig("tabSize"),
                },
            }
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
            .setName("Archive to a separate file")
            .setDesc(
                "If checked, the archiver will search for a file based on the pattern and will try to create it if needed"
            )
            .addToggle((toggleComponent) => {
                toggleComponent
                    .setValue(this.plugin.settings.archiveToSeparateFile)
                    .onChange(async (value) => {
                        this.plugin.settings.archiveToSeparateFile = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName("Separate archive file name")
            .setDesc(
                "If archiving to a separate file is on, replace the '%' with the active file name and try to find a file with this base name"
            )
            .addText((textComponent) => {
                textComponent
                    .setValue(this.plugin.settings.defaultArchiveFileName)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultArchiveFileName = value;
                        await this.plugin.saveSettings();
                    });
            });

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
            .setName("Add newlines around the archive")
            .setDesc("Add newlines around the contents of archive headings")
            .addToggle((toggleComponent) => {
                toggleComponent
                    .setValue(this.plugin.settings.addNewlinesAroundHeadings)
                    .onChange(async (value) => {
                        this.plugin.settings.addNewlinesAroundHeadings = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName("Depth of new archive headings")
            .setDesc(
                "New archives will be created by repeating '#' this many times"
            )
            .addDropdown((dropdownComponent) => {
                dropdownComponent
                    .addOptions({
                        "1": "1",
                        "2": "2",
                        "3": "3",
                        "4": "4",
                        "5": "5",
                        "6": "6",
                    })
                    .setValue(String(this.plugin.settings.archiveHeadingDepth))
                    .onChange(async (value) => {
                        this.plugin.settings.archiveHeadingDepth =
                            Number(value);
                        await this.plugin.saveSettings();
                    });
            });

        containerEl.createEl("h3", { text: "Date tree" });

        new Setting(containerEl)
            .setName("Use weeks")
            .setDesc("Add completed tasks under a link to the current week")
            .addToggle((toggleComponent) =>
                toggleComponent
                    .setValue(this.plugin.settings.useWeeks)
                    .onChange(async (value) => {
                        this.plugin.settings.useWeeks = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setDisabled(!this.plugin.settings.useWeeks)
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

        new Setting(containerEl)
            .setName("Use days")
            .setDesc("Add completed tasks under a link to the current day")
            .addToggle((toggleComponent) =>
                toggleComponent
                    .setValue(this.plugin.settings.useDays)
                    .onChange(async (value) => {
                        this.plugin.settings.useDays = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setDisabled(!this.plugin.settings.useDays)
            .setName("Daily note pattern")
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
                        .setDefaultFormat(this.plugin.settings.dailyNoteFormat)
                        .setPlaceholder(this.plugin.settings.dailyNoteFormat)
                        .setValue(this.plugin.settings.dailyNoteFormat)
                        .onChange(async (value) => {
                            this.plugin.settings.dailyNoteFormat = value;
                            await this.plugin.saveSettings();
                        });
                });
            });
    }
}
