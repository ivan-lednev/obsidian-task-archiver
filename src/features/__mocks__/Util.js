import { SectionParser } from "../../parser/SectionParser";
import { BlockParser } from "../../parser/BlockParser";
import { DateTreeResolver } from "../DateTreeResolver";
import {EditorFile} from "../../ActiveFile";

export const DEFAULT_SETTINGS_FOR_TESTS = {
    archiveHeading: "Archived",
    archiveHeadingDepth: 1,
    weeklyNoteFormat: "YYYY-MM-[W]-w",
    useWeeks: false,
    dailyNoteFormat: "YYYY-MM-DD",
    useDays: false,
    addNewlinesAroundHeadings: true,
    indentationSettings: {
        useTab: true,
        tabSize: 4,
    },
    archiveToSeparateFile: false,
    defaultArchiveFileName: "<filename> (archive)",
};

export class TestDependencies {
    constructor(activeFileState, settings) {
        this.mockActiveFile = buildMockMarkdownTFile(activeFileState);
        this.mockArchiveFile = buildMockMarkdownTFile([""]);
        this.mockVault = new MockVault(this.mockArchiveFile);
        this.mockWorkspace = {
            getActiveFile: () => this.mockActiveFile,
        };
        this.mockEditor = new MockEditor(this.mockActiveFile);
        this.editorFile = new EditorFile(this.mockEditor)
        this.sectionParser = new SectionParser(
            new BlockParser(settings.indentationSettings)
        );
        this.dateTreeResolver = new DateTreeResolver(settings);
    }
}

function buildMockMarkdownTFile(fileState) {
    // This is needed to pass `instanceof` checks
    const TFile = jest.requireMock("obsidian").TFile;
    const mockFile = Object.create(TFile.prototype);
    mockFile.state = fileState;

    mockFile.extension = "md";
    return mockFile;
}

class MockVault {
    constructor(archiveFile) {
        this.archiveFile = archiveFile;
    }

    // todo: this is not used for some reason
    read(file) {
        return file.state.join("\n");
    }

    modify(file, contents) {
        file.state = contents.split("\n");
    }

    getAbstractFileByPath() {
        return this.archiveFile;
    }
}

class MockEditor {
    constructor(activeFile) {
        this.activeFile = activeFile;
        this.cursor = { line: 0, ch: 0 };
    }

    getValue() {
        return this.activeFile.state.join("\n");
    }

    setValue(value) {
        this.activeFile.state = value.split("\n");
    }

    getCursor() {
        return this.cursor;
    }

    getLine(n) {
        return this.activeFile.state[n];
    }

    lastLine() {
        return this.activeFile.state.length - 1;
    }

    getRange(from, to) {
        const toLineExclusive = to.line + 1;
        return this.activeFile.state.slice(from.line, toLineExclusive).join("\n");
    }

    replaceRange(replacement, from, to) {
        const toLineExclusive = to.line - from.line + 1;
        this.activeFile.state.splice(
            from.line,
            toLineExclusive,
            ...replacement.split("\n")
        );
    }
}

