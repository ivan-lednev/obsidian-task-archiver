import { TFile } from "obsidian";

import { MockEditor } from "./MockEditor";
import { MockVault } from "./MockVault";

import { EditorFile } from "../../../ActiveFile";
import { DEFAULT_SETTINGS_FOR_TESTS } from "../../../Settings";
import { DateTreeService } from "../../../services/DateTreeService";
import { MetadataService } from "../../../services/MetadataService";
import { PlaceholderService } from "../../../services/PlaceholderService";
import { TaskTestingService } from "../../../services/TaskTestingService";
import { TextReplacementService } from "../../../services/TextReplacementService";
import { BlockParser } from "../../../services/parser/BlockParser";
import { SectionParser } from "../../../services/parser/SectionParser";

export class TestDependencies {
    constructor(
        activeFileState,
        {
            settings = DEFAULT_SETTINGS_FOR_TESTS,
            cursor = { line: 0, ch: 0 },
            vaultFiles = [],
        }
    ) {
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
        this.mockEditor = new MockEditor(this.mockActiveFile, cursor);
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
        this.settings = settings;
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
