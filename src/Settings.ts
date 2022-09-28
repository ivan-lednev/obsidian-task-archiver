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

export interface Settings {
    archiveHeading: string;
    archiveHeadingDepth: number;
    weeklyNoteFormat: string;
    useWeeks: boolean;
    dailyNoteFormat: string;
    useDays: boolean;
    additionalTaskPattern: string;
    addNewlinesAroundHeadings: boolean;
    archiveToSeparateFile: boolean;
    defaultArchiveFileName: string;
    indentationSettings: IndentationSettings;
    textReplacement: TextReplacementSettings;
}

export const DEFAULT_SETTINGS: Settings = {
    archiveHeading: "Archived",
    archiveHeadingDepth: 1,
    weeklyNoteFormat: "YYYY-MM-[W]-w",
    useWeeks: true,
    dailyNoteFormat: "YYYY-MM-DD",
    useDays: false,
    additionalTaskPattern: "",
    addNewlinesAroundHeadings: true,
    archiveToSeparateFile: false,
    defaultArchiveFileName: "% (archive)",
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
};
