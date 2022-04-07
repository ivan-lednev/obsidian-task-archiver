import { SectionParser } from "./parser/SectionParser";
import { ArchiverSettings } from "./archiver/ArchiverSettings";
import { Editor } from "obsidian";
import { buildIndentation, detectListUnderCursor, sortBlocksRecursively } from "./util";

export class Sorter {
    constructor(
        private readonly parser: SectionParser,
        private readonly settings: ArchiverSettings
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