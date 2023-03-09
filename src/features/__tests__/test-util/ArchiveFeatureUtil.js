import { TestDependencies } from "./TestUtil";

import { DEFAULT_SETTINGS_FOR_TESTS } from "../../../Settings";
import { ArchiveFeature } from "../../ArchiveFeature";

function buildArchiveFeature(testDependencies, settings) {
    return new ArchiveFeature(
        testDependencies.mockVault,
        testDependencies.mockWorkspace,
        testDependencies.sectionParser,
        testDependencies.dateTreeService,
        testDependencies.taskTestingService,
        testDependencies.placeholderService,
        testDependencies.textReplacementService,
        testDependencies.metadataService,
        settings
    );
}

export async function archiveTasksAndCheckMessage(activeFileState, expectedMessage) {
    const { message } = await archiveTasks(activeFileState, DEFAULT_SETTINGS_FOR_TESTS);
    expect(message).toEqual(expectedMessage);
}

export async function archiveTasksAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const { mockActiveFile } = await archiveTasks(activeFileState, settings);
    expect(mockActiveFile.state).toEqual(expectedActiveFileState);
}

export async function archiveTasks(activeFileState, settings, vaultFiles = []) {
    const testDependencies = new TestDependencies(
        activeFileState,
        settings,
        vaultFiles
    );
    const archiveFeature = buildArchiveFeature(testDependencies, settings);

    const message = await archiveFeature.archiveShallowTasksInActiveFile(
        testDependencies.editorFile
    );

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
    const testDependencies = new TestDependencies(activeFileState, settings);
    const archiveFeature = buildArchiveFeature(testDependencies, settings);

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
    const testDependencies = new TestDependencies(activeFileState, settings);
    const archiveFeature = buildArchiveFeature(testDependencies, settings);

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
    const testDependencies = new TestDependencies(activeFileState, settings);
    const archiveFeature = buildArchiveFeature(testDependencies, settings);

    testDependencies.mockEditor.cursor = cursor;
    await archiveFeature.archiveHeadingUnderCursor(testDependencies.mockEditor);

    return testDependencies;
}

export async function archiveTaskUnderCursorAndCheckActiveFile(
    activeFileState,
    expectedActiveFileState,
    cursor = { line: 0, ch: 0 },
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const {
        mockActiveFile: { state },
    } = await archiveTaskUnderCursor(activeFileState, cursor, settings);
    expect(state).toEqual(expectedActiveFileState);
}

async function archiveTaskUnderCursor(
    activeFileState,
    cursor = { line: 0, ch: 0 },
    settings = DEFAULT_SETTINGS_FOR_TESTS
) {
    const testDependencies = new TestDependencies(activeFileState, settings);
    const archiveFeature = buildArchiveFeature(testDependencies, settings);

    testDependencies.mockEditor.cursor = cursor;
    await archiveFeature.archiveTaskUnderCursor(testDependencies.mockEditor);

    return testDependencies;
}
