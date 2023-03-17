import { Workspace } from "obsidian";

import { DEFAULT_DATE_FORMAT } from "../Constants";
import {
    FILE_EXTENSION_PATTERN,
    OBSIDIAN_TASKS_COMPLETED_DATE_PATTERN,
} from "../Patterns";
import { Block } from "../model/Block";

interface PlaceholderContext {
    block?: Block;
    dateFormat?: string;
    heading?: string;
    obsidianTasksCompletedDateFormat?: string;
}

export class PlaceholderService {
    /** @deprecated */
    private static readonly ACTIVE_FILE_PLACEHOLDER = "%";

    private static readonly ACTIVE_FILE_PLACEHOLDER_NEW = "{{sourceFileName}}";

    private static readonly ACTIVE_FILE_PATH_PLACEHOLDER = "{{sourceFilePath}}";

    private static readonly DATE_PLACEHOLDER = "{{date}}";

    private static readonly HEADING_PLACEHOLDER = "{{heading}}";

    private static readonly OBSIDIAN_TASKS_COMPLETED_DATE_PLACEHOLDER =
        "{{obsidianTasksCompletedDate}}";

    private static readonly NO_FILE_OPEN = "No file open";

    constructor(private readonly workspace: Workspace) {}

    private getActiveFile() {
        return this.workspace.getActiveFile();
    }

    private getActiveFilePathWithoutExtension() {
        return (
            this.getActiveFile()?.path?.replace(FILE_EXTENSION_PATTERN, "") ||
            PlaceholderService.NO_FILE_OPEN
        );
    }

    resolve(
        text: string,
        {
            block,
            dateFormat = DEFAULT_DATE_FORMAT,
            heading = "", // todo: this too is inside a task, it should be removed
            obsidianTasksCompletedDateFormat = DEFAULT_DATE_FORMAT, // todo: this can be read from settings
        }: PlaceholderContext = {}
    ) {
        let obsidianTasksCompletedDate = window.moment().format(DEFAULT_DATE_FORMAT);

        const match = block?.text?.match?.(OBSIDIAN_TASKS_COMPLETED_DATE_PATTERN);
        if (match) {
            [, obsidianTasksCompletedDate] = match;
        }

        return text
            .replace(
                PlaceholderService.ACTIVE_FILE_PLACEHOLDER,
                this.getActiveFile()?.basename || PlaceholderService.NO_FILE_OPEN
            )
            .replace(
                PlaceholderService.ACTIVE_FILE_PLACEHOLDER_NEW,
                this.getActiveFile()?.basename || PlaceholderService.NO_FILE_OPEN
            )
            .replace(
                PlaceholderService.ACTIVE_FILE_PATH_PLACEHOLDER,
                this.getActiveFilePathWithoutExtension()
            )
            .replace(
                PlaceholderService.HEADING_PLACEHOLDER,
                heading?.trim() || // todo: remove trim
                    this.getActiveFile()?.basename ||
                    PlaceholderService.NO_FILE_OPEN
            )
            .replace(
                PlaceholderService.DATE_PLACEHOLDER,
                window.moment().format(dateFormat)
            )
            .replace(
                PlaceholderService.OBSIDIAN_TASKS_COMPLETED_DATE_PLACEHOLDER,
                window
                    .moment(obsidianTasksCompletedDate)
                    .format(obsidianTasksCompletedDateFormat)
            );
    }
}
