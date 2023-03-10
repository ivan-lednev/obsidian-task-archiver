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
    addNewlinesAroundHeadings: true,
    additionalMetadataBeforeArchiving: {
        addMetadata: false,
        dateFormat: DEFAULT_DATE_FORMAT,
        metadata: "(this was archived)",
    },
    additionalTaskPattern: "",
    archiveAllCheckedTaskTypes: false,
    archiveHeadingDepth: 1,
    archiveToSeparateFile: false,
    archiveUnderHeading: true,
    dailyNoteFormat: DEFAULT_DATE_FORMAT,
    dateFormat: DEFAULT_DATE_FORMAT,
    defaultArchiveFileName: "{{sourceFileName}} (archive)",
    headings: [],
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
    useDays: false,
    useWeeks: false,
    weeklyNoteFormat: "YYYY-MM-[W]-w",
};

export const DEFAULT_SETTINGS_FOR_TESTS: Settings = {
    ...DEFAULT_SETTINGS,
    defaultArchiveFileName: "folder/sub-folder/mock-file-base-name",
    headings: [{ text: "Archived" }],
};
