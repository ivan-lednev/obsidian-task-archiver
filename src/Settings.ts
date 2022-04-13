import { IndentationSettings } from "./IndentationSettings";

export interface Settings {
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
