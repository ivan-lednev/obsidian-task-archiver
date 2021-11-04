import {
    App,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    TFile,
} from "obsidian";
import { Archiver } from "src/archiver/Archiver";
import { ArchiverSettings } from "./archiver/ArchiverSettings";

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
            const archiveFileHandle = await this.getArchiveForFile(
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
            const archiveResult = archiver.archiveTasksToSameFile(activeFileLines);
            new Notice(archiveResult.summary);
            this.app.vault.modify(activeFile, archiveResult.lines.join("\n"));
        }
    }

    private async getArchiveForFile(activeFile: TFile) {
        const archiveFileName =
            this.settings.defaultArchiveFileName.replace(
                "%",
                activeFile.basename
            ) + ".md";

        // TODO: archiving to a folder will happen here
        let archiveFile = this.app.vault.getAbstractFileByPath(archiveFileName);

        if (!archiveFile) {
            try {
                archiveFile = await this.app.vault.create(archiveFileName, "");
            } catch (error) {
                console.error(
                    `Unable to create an archive file with the name '${archiveFileName}'`
                );
            }
        }

        archiveFile = this.app.vault.getAbstractFileByPath(archiveFileName);

        if (!(archiveFile instanceof TFile)) {
            throw new Error(`${archiveFileName} is a folder, not a file`);
        }

        return archiveFile;
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
