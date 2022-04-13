import { SectionParser } from "../parser/SectionParser";
import { Settings } from "../Settings";
import { Editor } from "obsidian";
import {
    buildIndentation,
    detectListUnderCursor,
    sortBlocksRecursively,
} from "../Util";

export class TaskListSorter {
    constructor(
        private readonly parser: SectionParser,
        private readonly settings: Settings
    ) {}

    sortListUnderCursor(editor: Editor) {
        const thisListRange = detectListUnderCursor(editor);
        if (thisListRange === null) {
            return;
        }

        const thisListLines = editor.getRange(...thisListRange).split("\n");

        const parsedRoot = this.parser.parse(thisListLines);
        sortBlocksRecursively(parsedRoot.blockContent);
        const newListLines = parsedRoot
            .stringify(buildIndentation(this.settings.indentationSettings))
            .join("\n");

        editor.replaceRange(newListLines, ...thisListRange);
    }
}
