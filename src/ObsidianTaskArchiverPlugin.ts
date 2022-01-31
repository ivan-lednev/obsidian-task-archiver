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
            callback: () => this.archiveTasksInCurrentFile(),
        });

        await this.loadSettings();

        this.addSettingTab(new ArchiverSettingTab(this.app, this));
    }

    private async archiveTasksInCurrentFile() {
        const archiver = new Archiver(
            this.app.vault,
            this.app.workspace,
            this.settings
        );

        if (this.settings.archiveToSeparateFile) {
            // const currentFile = this.app.workspace.getActiveFile();
            // const currentFileLines = await this.readFile(currentFile);
            // const archiveFile = await this.getArchiveForFile(currentFile);
            // const archiveFileLines = await this.readFile(archiveFile);
            //
            // const archiveResult = archiver.archiveTasksToSeparateFile(
            //     currentFileLines,
            //     archiveFileLines
            // );
            //
            // new Notice(archiveResult.summary);
            //
            // this.writeToFile(currentFile, archiveResult.lines);
            // this.writeToFile(archiveFile, archiveResult.archiveLines);
        } else {
            await archiver.archiveTasksInActiveFile();
        }
    }

    private writeToFile(file: TFile, lines: string[]) {
        this.app.vault.modify(file, lines.join("\n"));
    }

    private async readFile(file: TFile) {
        if (file === null || file.extension !== "md") {
            new Notice("The archiver works only in markdown (.md) files!");
            return;
        }
        const fileContents = await this.app.vault.read(file);
        return fileContents.split("\n");
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
                new Notice(
                    `Unable to create an archive file with the name '${archiveFileName}'`
                );
            }
        }

        archiveFile = this.app.vault.getAbstractFileByPath(archiveFileName);

        if (!(archiveFile instanceof TFile)) {
            const message = `${archiveFileName} is not a valid file`;
            new Notice(message);
            throw new Error(message);
        }

        return archiveFile;
    }

    async loadSettings() {
        const getConfig = (key: string) => {
            return (this.app.vault as any).getConfig(key);
        };

        this.settings = Object.assign(
            {},
            DefaultSettings,
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
