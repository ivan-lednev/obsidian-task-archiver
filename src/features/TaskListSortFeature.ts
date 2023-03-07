import { Editor } from "obsidian";

import { partition } from "lodash";

import { Settings } from "../Settings";
import { Block } from "../model/Block";
import { TaskTestingService } from "../services/TaskTestingService";
import { SectionParser } from "../services/parser/SectionParser";
import { detectListUnderCursor } from "../util/CodeMirrorUtil";
import { buildIndentation } from "../util/Util";

export class TaskListSortFeature {
    constructor(
        private readonly parser: SectionParser,
        private readonly taskTestingService: TaskTestingService,
        private readonly settings: Settings
    ) {}

    sortListUnderCursor(editor: Editor) {
        const thisListRange = detectListUnderCursor(editor);
        if (thisListRange === null) {
            return;
        }

        const thisListLines = editor.getRange(...thisListRange).split("\n");

        const parsedRoot = this.parser.parse(thisListLines);
        this.sortBlocksRecursively(parsedRoot.blockContent);
        const newListLines = parsedRoot
            .stringify(buildIndentation(this.settings.indentationSettings))
            .join("\n");

        editor.replaceRange(newListLines, ...thisListRange);
    }

    private sortBlocksRecursively(root: Block) {
        const [tasks, nonTasks] = partition(root.children, (b) =>
            this.taskTestingService.isTask(b.text)
        );
        const [complete, incomplete] = partition(tasks, (b) =>
            this.taskTestingService.isCompletedTask(b.text)
        );
        root.children = [...nonTasks, ...incomplete, ...complete];

        for (const child of root.children) {
            this.sortBlocksRecursively(child);
        }
    }
}
