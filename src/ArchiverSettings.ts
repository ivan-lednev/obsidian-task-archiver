export interface ArchiverSettings {
    archiveHeading: string;
    weeklyNoteFormat: string;
    useDateTree: boolean;
    indentationSettings: IndentationSettings;
}

interface IndentationSettings {
    useTab: boolean;
    tabSize: number;
}
