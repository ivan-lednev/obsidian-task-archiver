import { DEFAULT_DATE_FORMAT } from "./Constants";

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

export type Rule = Pick<
    Settings,
    "defaultArchiveFileName" | "dateFormat" | "archiveToSeparateFile"
> & { statuses: string };

export enum TaskSortOrder {
    NEWEST_FIRST = "Newest first",
    NEWEST_LAST = "Newest last",
}

export interface HeadingConfig {
    text: string;
    dateFormat?: string;
}

export interface Settings {
    taskSortOrder: TaskSortOrder;
    dateFormat: string;
    /**
     * @deprecated; use headings instead
     */
    archiveHeading?: string;
    archiveHeadingDepth: number;
    weeklyNoteFormat: string;
    useWeeks: boolean;
    dailyNoteFormat: string;
    useDays: boolean;
    useAdditionalTaskPattern: boolean;
    additionalTaskPattern: string;
    addNewlinesAroundHeadings: boolean;
    archiveToSeparateFile: boolean;
    archiveUnderHeading: boolean;
    defaultArchiveFileName: string;
    archiveAllCheckedTaskTypes: boolean;
    sortAlphabetically: boolean;
    indentationSettings: IndentationSettings;
    textReplacement: TextReplacementSettings;
    additionalMetadataBeforeArchiving: AdditionalMetadataSettings;
    headings: HeadingConfig[];
    rules: Rule[];
}

export const DEFAULT_SETTINGS: Settings = {
    taskSortOrder: TaskSortOrder.NEWEST_LAST,
    archiveHeadingDepth: 1,
    weeklyNoteFormat: "YYYY-MM-[W]-w",
    useWeeks: true,
    dailyNoteFormat: "YYYY-MM-DD",
    useDays: false,
    useAdditionalTaskPattern: false,
    additionalTaskPattern: "",
    addNewlinesAroundHeadings: true,
    archiveToSeparateFile: false,
    archiveUnderHeading: true,
    defaultArchiveFileName: "% (archive)",
    archiveAllCheckedTaskTypes: false,
    sortAlphabetically: false,
    dateFormat: "YYYY-MM-DD",
    headings: [],
    rules: [],
    indentationSettings: {
        useTab: true,
        tabSize: 4,
    },
    textReplacement: {
        applyReplacement: false,
        regex: "#([A-Za-z-]+)",
        replacement: "@$1",
        replacementTest: "task #some-tag",
    },
    additionalMetadataBeforeArchiving: {
        dateFormat: "YYYY-MM-DD",
        addMetadata: false,
        metadata: "(this was archived)",
    },
};
export const DEFAULT_SETTINGS_FOR_TESTS: Settings = {
    archiveUnderHeading: true,
    taskSortOrder: TaskSortOrder.NEWEST_LAST,
    dateFormat: DEFAULT_DATE_FORMAT,
    useAdditionalTaskPattern: false,
    archiveHeadingDepth: 1,
    weeklyNoteFormat: "YYYY-MM-[W]-w",
    useWeeks: false,
    dailyNoteFormat: "YYYY-MM-DD",
    useDays: false,
    additionalTaskPattern: "",
    addNewlinesAroundHeadings: true,
    sortAlphabetically: false,
    headings: [{ text: "Archived" }],
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
