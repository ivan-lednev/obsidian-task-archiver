import { Workspace } from "obsidian";

import { isEmpty } from "lodash/fp";

import { DEFAULT_DATE_FORMAT, placeholders } from "../Constants";
import { FILE_EXTENSION_PATTERN } from "../Patterns";
import { Block } from "../model/Block";
import { getTaskCompletionDate } from "../util/Util";

interface PlaceholderContext {
    block?: Block;
    dateFormat?: string;
    heading?: string;
    obsidianTasksCompletedDateFormat?: string;
}

export class PlaceholderService {
    private static readonly NO_FILE_OPEN = "No file open";

    constructor(private readonly workspace: Workspace) {}

    private getActiveFile() {
        return this.workspace.getActiveFile();
    }

    private getActiveFileBaseName() {
        return this.getActiveFile()?.basename || PlaceholderService.NO_FILE_OPEN;
    }

    private getActiveFilePathWithoutExtension() {
        return (
            this.getActiveFile()?.path?.replace(FILE_EXTENSION_PATTERN, "") ||
            PlaceholderService.NO_FILE_OPEN
        );
    }

    private createHeadingChain(block: Block) {
        let chain: string[] = [];
        let parent = block.parentSection;
        while (parent.text) {
            chain = [parent.text.trim(), ...chain]; // todo: needless trim
            parent = parent.parent;
        }
        if (isEmpty(chain)) {
            return this.getActiveFileBaseName();
        }
        return chain.join(" > ");
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
        return text
            .replace(placeholders.ACTIVE_FILE, this.getActiveFileBaseName())
            .replace(placeholders.ACTIVE_FILE_NEW, this.getActiveFileBaseName())
            .replace(
                placeholders.ACTIVE_FILE_PATH,
                this.getActiveFilePathWithoutExtension()
            )
            .replace(
                placeholders.HEADING,
                heading?.trim() || // todo: remove trim
                    this.getActiveFileBaseName()
            )
            .replace(
                placeholders.HEADING_CHAIN,
                block ? this.createHeadingChain(block) : this.getActiveFileBaseName()
            )
            .replace(placeholders.DATE, window.moment().format(dateFormat))
            .replace(
                placeholders.OBSIDIAN_TASKS_COMPLETED_DATE,
                window
                    .moment(getTaskCompletionDate(block?.text))
                    .format(obsidianTasksCompletedDateFormat)
            );
    }
}
