import { TFile } from "obsidian";

import { EditorFile } from "../../ActiveFile";
import { TaskSortOrder } from "../../Settings";
import { DateTreeService } from "../../services/DateTreeService";
import { MetadataService } from "../../services/MetadataService";
import { PlaceholderService } from "../../services/PlaceholderService";
import { TaskTestingService } from "../../services/TaskTestingService";
import { TextReplacementService } from "../../services/TextReplacementService";
import { BlockParser } from "../../services/parser/BlockParser";
import { SectionParser } from "../../services/parser/SectionParser";

// todo: use TS here
export const DEFAULT_SETTINGS_FOR_TESTS = {
    archiveUnderHeading: true,
    taskSortOrder: TaskSortOrder.NEWEST_LAST,
    archiveHeading: "Archived",
    archiveHeadingDepth: 1,
    weeklyNoteFormat: "YYYY-MM-[W]-w",
    useWeeks: false,
    dailyNoteFormat: "YYYY-MM-DD",
    useDays: false,
    additionalTaskPattern: "",
    addNewlinesAroundHeadings: true,
    sortAlphabetically: false,
    headings: [],
    indentationSettings: {
        useTab: true,
        tabSize: 4,
    },
    archiveToSeparateFile: false,
    defaultArchiveFileName: "folder/sub-folder/mock-file-base-name",
    archiveAllCheckedTaskTypes: false,
    textReplacement: {
        applyReplacement: false,
        regex: "#([A-Za-z-]+)",
        replacement: "@$1",
        replacementTest: "task #some-tag",
    },
    additionalMetadataBeforeArchiving: {
        addMetadata: false,
        metadata: "",
        dateFormat: "YYYY-MM-DD",
    },
    rules: [],
};

export class TestDependencies {
    constructor(activeFileState, settings, vaultFiles = []) {
        this.mockActiveFile = createTFile({
            state: activeFileState,
            path: `${DEFAULT_SETTINGS_FOR_TESTS.defaultArchiveFileName}.md`,
        });
        this.mockArchiveFile = createTFile({
            state: [""],
            path: `${DEFAULT_SETTINGS_FOR_TESTS.defaultArchiveFileName}.md`,
        });

        this.mockVault = new MockVault([this.mockArchiveFile, ...vaultFiles]);
        this.mockWorkspace = {
            getActiveFile: () => this.mockActiveFile,
        };
        this.mockEditor = new MockEditor(this.mockActiveFile);
        this.editorFile = new EditorFile(this.mockEditor);

        // todo: no need to initialize real deps in tests
        this.sectionParser = new SectionParser(
            new BlockParser(settings.indentationSettings)
        );
        this.dateTreeService = new DateTreeService(settings);
        this.taskTestingService = new TaskTestingService(settings);
        this.placeholderService = new PlaceholderService(this.mockWorkspace);
        this.textReplacementService = new TextReplacementService(settings);
        this.metadataService = new MetadataService(this.placeholderService, settings);
    }
}

// This is needed to pass `instanceof` checks
export function createTFile({ state, path }) {
    return Object.assign(new TFile(), {
        // todo: move to variable
        basename: "mock-file-base-name",
        extension: "md",
        path,
        state,
    });
}

class MockVault {
    constructor(files) {
        this.files = files;
    }

    read(file) {
        return file.state.join("\n");
    }

    modify(file, contents) {
        file.state = contents.split("\n");
    }

    getAbstractFileByPath(path) {
        const found = this.files.find((file) => file.path === path);
        if (!found) {
            throw new Error("There is no file in the vault");
        }
        return found;
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
        const newLines = replacement === "" ? [] : replacement.split("\n");
        const deletingWithNewline = to.ch === 0;
        const deleteCount = deletingWithNewline
            ? to.line - from.line
            : to.line - from.line + 1;
        this.activeFile.state.splice(from.line, deleteCount, ...newLines);
    }

    setCursor(pos) {
        this.cursor = pos;
    }
}
