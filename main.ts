import {
    App,
    Modal,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
} from "obsidian";
import { Archiver } from "src/archiver";

export default class ObsidianTaskArchiver extends Plugin {
    async onload() {
        this.addCommand({
            id: "archive-tasks",
            name: "Archive tasks in this file",
            callback: () => this.archiveTasksInCurrentFile(),
        });
    }

    private async archiveTasksInCurrentFile() {
        const activeFile = this.app.workspace.getActiveFile();
        const fileContents = await this.app.vault.read(activeFile);
        const lines = fileContents.split("\n");
        const linesWithInsertedArchivedTasks = new Archiver(true).archiveTasks(
            lines
        );

        this.app.vault.modify(
            activeFile,
            linesWithInsertedArchivedTasks.join("\n")
        );
    }
}
