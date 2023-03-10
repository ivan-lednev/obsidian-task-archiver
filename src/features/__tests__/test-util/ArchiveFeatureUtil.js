import { TestDependencies } from "./TestUtil";

import { DEFAULT_SETTINGS_FOR_TESTS } from "../../../Settings";
import { ArchiveFeature } from "../../ArchiveFeature";

function buildArchiveFeature(activeFileState, settings) {
    const deps = new TestDependencies(activeFileState, settings);
    const archiveFeature = new ArchiveFeature(
        deps.mockVault,
        deps.mockWorkspace,
        deps.sectionParser,
        deps.dateTreeService,
        deps.taskTestingService,
        deps.placeholderService,
        deps.textReplacementService,
        deps.metadataService,
        deps.settings
    );
    return {
        testDependencies: deps,
        vault: deps.mockVault,
        activeFile: deps.mockActiveFile,
        editorFile: deps.editorFile,
        archiveFeature,
    };
}

export async function archiveTasksAndCheckMessage(activeFileState, expectedMessage) {
    const { message } = await archiveTasks(activeFileState, {
        settings: DEFAULT_SETTINGS_FOR_TESTS,
    });

    expect(message).toEqual(expectedMessage);
}

export async function archiveTasksAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    { settings = DEFAULT_SETTINGS_FOR_TESTS } = { settings: DEFAULT_SETTINGS_FOR_TESTS }
) {
    const { mockActiveFile } = await archiveTasks(activeFileState, {
        settings,
    });

    expect(mockActiveFile.state).toEqual(expectedActiveFileState);
}

export async function archiveTasks(
    activeFileState,
    { settings = DEFAULT_SETTINGS_FOR_TESTS, vaultFiles = [] }
) {
    const { archiveFeature, editorFile, testDependencies } = buildArchiveFeature(
        activeFileState,
        {
            settings,
            vaultFiles,
        }
    );

    const message = await archiveFeature.archiveShallowTasksInActiveFile(editorFile);

    return { ...testDependencies, message };
}

export async function archiveTasksRecursivelyAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const {
        mockActiveFile: { state },
    } = await archiveTasksRecursively(activeFileState, settings);

    expect(state).toEqual(expectedActiveFileState);
}

async function archiveTasksRecursively(activeFileState, settings) {
    const { testDependencies, archiveFeature } = buildArchiveFeature(activeFileState, {
        settings,
    });

    const message = await archiveFeature.archiveDeepTasksInActiveFile(
        testDependencies.editorFile
    );

    return { ...testDependencies, message };
}

export async function deleteTasksAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const {
        mockActiveFile: { state },
    } = await deleteTasks(activeFileState, settings);

    expect(state).toEqual(expectedActiveFileState);
}

async function deleteTasks(activeFileState, settings) {
    const { testDependencies, archiveFeature } = buildArchiveFeature(activeFileState, {
        settings,
    });

    const message = await archiveFeature.deleteTasksInActiveFile(
        testDependencies.editorFile
    );

    return { ...testDependencies, message };
}

export async function archiveHeadingAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    cursor = { line: 0, ch: 0 },
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const testDependencies = await archiveHeading(activeFileState, cursor, settings);

    expect(testDependencies.mockActiveFile.state).toEqual(expectedActiveFileState);
}

export async function archiveHeading(
    activeFileState,
    cursor = { line: 0, ch: 0 },
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const { testDependencies, archiveFeature } = buildArchiveFeature(activeFileState, {
        settings,
    });

    testDependencies.mockEditor.cursor = cursor;
    await archiveFeature.archiveHeadingUnderCursor(testDependencies.mockEditor);

    return testDependencies;
}

export async function archiveTaskUnderCursorAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    settings = {}
) {
    const {
        mockActiveFile: { state },
    } = await archiveTaskUnderCursor(activeFileState, settings);

    expect(state).toEqual(expectedActiveFileState);
}

async function archiveTaskUnderCursor(activeFileState, settings) {
    const { testDependencies, archiveFeature } = buildArchiveFeature(
        activeFileState,
        settings
    );

    await archiveFeature.archiveTaskUnderCursor(testDependencies.mockEditor);

    return testDependencies;
}
