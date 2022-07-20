export interface IndentationSettings {
    useTab: boolean;
    tabSize: number;
}

export interface Settings {
    archiveHeading: string;
    archiveHeadingDepth: number;
    weeklyNoteFormat: string;
    useWeeks: boolean;
    dailyNoteFormat: string;
    useDays: boolean;
    indentationSettings: IndentationSettings;
    taskPattern: string; 
    addNewlinesAroundHeadings: boolean;
    archiveToSeparateFile: boolean;
    defaultArchiveFileName: string;
}

export const DEFAULT_SETTINGS: Settings = {
    archiveHeading: "Archived",
    archiveHeadingDepth: 1,
    weeklyNoteFormat: "YYYY-MM-[W]-w",
    useWeeks: true,
    dailyNoteFormat: "YYYY-MM-DD",
    useDays: false,
    taskPattern: "", 
    addNewlinesAroundHeadings: true,
    archiveToSeparateFile: false,
    defaultArchiveFileName: "% (archive)",
    indentationSettings: {
        useTab: true,
        tabSize: 4,
    },
};
