import { Editor, TFile, Vault } from "obsidian";

export interface ActiveFile {
    readLines: () => Promise<string[]>;
    writeLines: (lines: string[]) => Promise<void>;
}

export class EditorFile implements ActiveFile {
    constructor(private readonly editor: Editor) {}

    async readLines() {
        return this.editor.getValue().split("\n");
    }

    async writeLines(lines: string[]) {
        this.editor.setValue(lines.join("\n"));
    }
}

export class DiskFile implements ActiveFile {
    constructor(private readonly file: TFile, private readonly vault: Vault) {
        if (!this.file || this.file.extension !== "md") {
            throw new Error("The archiver works only in markdown (.md) files!");
        }
    }

    async readLines() {
        return (await this.vault.read(this.file)).split("\n");
    }

    async writeLines(lines: string[]) {
        await this.vault.modify(this.file, lines.join("\n"));
    }
}
