export interface ArchiverSettings {
    archiveHeading: string;
    archiveHeadingDepth: number;
    weeklyNoteFormat: string;
    useWeeks: boolean;
    dailyNoteFormat: string;
    useDays: boolean;
    indentationSettings: IndentationSettings;
    addNewlinesAroundHeadings: boolean;
    archiveToSeparateFile: boolean;
    defaultArchiveFileName: string;
}

interface IndentationSettings {
    useTab: boolean;
    tabSize: number;
}
