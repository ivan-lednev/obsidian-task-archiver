import { DEFAULT_DATE_FORMAT, placeholders } from "./Constants";

export interface IndentationSettings {
    useTab: boolean;
    tabSize: number;
}

export interface TextReplacementSettings {
    applyReplacement: boolean;
    regex: string;
    replacement: string;
    replacementTest: string;
}

export interface AdditionalMetadataSettings {
    addMetadata: boolean;
    dateFormat: string;
    metadata: string;
}

export enum ArchiveFileType {
    DAILY = "Daily note",
    CUSTOM = "Custom note",
}

export type Rule = Pick<
    Settings,
    | "defaultArchiveFileName"
    | "dateFormat"
    | "archiveToSeparateFile"
    | "separateFileType"
    | "obsidianTasksCompletedDateFormat"
> & { statuses?: string; pathPatterns?: string; textPatterns?: string };

export enum TaskSortOrder {
    NEWEST_FIRST = "Newest first",
    NEWEST_LAST = "Newest last",
}

export interface TreeLevelConfig {
    text: string;
    dateFormat?: string;
    obsidianTasksCompletedDateFormat?: string;
}

export interface Settings {
    taskSortOrder: TaskSortOrder;
    dateFormat: string;
    /**
     * @deprecated; use headings instead
     */
    archiveHeading?: string;
    archiveHeadingDepth: number;
    /**
     * @deprecated; use listItems instead
     */
    weeklyNoteFormat?: string;
    /**
     * @deprecated; use listItems instead
     */
    useWeeks?: boolean;
    /**
     * @deprecated; use listItems instead
     */
    dailyNoteFormat?: string;
    /**
     * @deprecated; use listItems instead
     */
    useDays?: boolean;
    useAdditionalTaskPattern: boolean;
    additionalTaskPattern: string;
    addNewlinesAroundHeadings: boolean;
    archiveToSeparateFile: boolean;
    separateFileType: ArchiveFileType;
    // todo: this is related only to separate file names. These settings should be grouped together
    obsidianTasksCompletedDateFormat: string;
    archiveUnderHeading: boolean;
    defaultArchiveFileName: string;
    archiveAllCheckedTaskTypes: boolean;
    sortAlphabetically: boolean;
    indentationSettings: IndentationSettings;
    textReplacement: TextReplacementSettings;
    additionalMetadataBeforeArchiving: AdditionalMetadataSettings;
    headings: TreeLevelConfig[];
    archiveUnderListItems: boolean;
    listItems: TreeLevelConfig[];
    rules: Rule[];
    archiveOnlyIfSubtasksAreDone: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    addNewlinesAroundHeadings: true,
    additionalMetadataBeforeArchiving: {
        addMetadata: true,
        dateFormat: DEFAULT_DATE_FORMAT,
        metadata: `🔒 [[${placeholders.DATE}]] 🕸️ ${placeholders.HEADING_CHAIN}`,
    },
    additionalTaskPattern: "",
    archiveAllCheckedTaskTypes: false,
    archiveHeadingDepth: 1,
    archiveToSeparateFile: false,
    separateFileType: ArchiveFileType.CUSTOM,
    obsidianTasksCompletedDateFormat: DEFAULT_DATE_FORMAT,
    archiveUnderHeading: true,
    dateFormat: DEFAULT_DATE_FORMAT,
    defaultArchiveFileName: `${placeholders.ACTIVE_FILE_NEW} (archive)`,
    headings: [{ text: "Archived" }],
    listItems: [],
    indentationSettings: {
        tabSize: 4,
        useTab: true,
    },
    rules: [],
    sortAlphabetically: false,
    taskSortOrder: TaskSortOrder.NEWEST_LAST,
    textReplacement: {
        applyReplacement: false,
        regex: "#([A-Za-z-]+)",
        replacement: "@$1",
        replacementTest: "task #some-tag",
    },
    useAdditionalTaskPattern: false,
    archiveUnderListItems: false,
    archiveOnlyIfSubtasksAreDone: false,
};

export const DEFAULT_SETTINGS_FOR_TESTS: Settings = {
    ...DEFAULT_SETTINGS,
    additionalMetadataBeforeArchiving: {
        ...DEFAULT_SETTINGS.additionalMetadataBeforeArchiving,
        addMetadata: false,
    },
    defaultArchiveFileName: "folder/sub-folder/mock-file-base-name",
    headings: [{ text: "Archived" }],
};
