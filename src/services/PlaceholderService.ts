import { Workspace } from "obsidian";

import { isEmpty } from "lodash/fp";

import { DEFAULT_DATE_FORMAT } from "../Constants";
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
    /** @deprecated */
    private static readonly ACTIVE_FILE_PLACEHOLDER = "%";

    private static readonly ACTIVE_FILE_PLACEHOLDER_NEW = "{{sourceFileName}}";

    private static readonly ACTIVE_FILE_PATH_PLACEHOLDER = "{{sourceFilePath}}";

    private static readonly DATE_PLACEHOLDER = "{{date}}";

    private static readonly HEADING_PLACEHOLDER = "{{heading}}";

    private static readonly HEADING_CHAIN_PLACEHOLDER = "{{headingChain}}";

    private static readonly OBSIDIAN_TASKS_COMPLETED_DATE_PLACEHOLDER =
        "{{obsidianTasksCompletedDate}}";

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
            .replace(
                PlaceholderService.ACTIVE_FILE_PLACEHOLDER,
                this.getActiveFileBaseName()
            )
            .replace(
                PlaceholderService.ACTIVE_FILE_PLACEHOLDER_NEW,
                this.getActiveFileBaseName()
            )
            .replace(
                PlaceholderService.ACTIVE_FILE_PATH_PLACEHOLDER,
                this.getActiveFilePathWithoutExtension()
            )
            .replace(
                PlaceholderService.HEADING_PLACEHOLDER,
                heading?.trim() || // todo: remove trim
                    this.getActiveFileBaseName()
            )
            .replace(
                PlaceholderService.HEADING_CHAIN_PLACEHOLDER,
                block ? this.createHeadingChain(block) : this.getActiveFileBaseName()
            )
            .replace(
                PlaceholderService.DATE_PLACEHOLDER,
                window.moment().format(dateFormat)
            )
            .replace(
                PlaceholderService.OBSIDIAN_TASKS_COMPLETED_DATE_PLACEHOLDER,
                window
                    .moment(getTaskCompletionDate(block?.text))
                    .format(obsidianTasksCompletedDateFormat)
            );
    }
}
