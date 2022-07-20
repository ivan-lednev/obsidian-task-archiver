import { Editor } from "obsidian";

import { partition } from "lodash";

import { TaskTester } from "./TaskTester";

import { Settings } from "../Settings";
import { buildIndentation, detectListUnderCursor } from "../Util";
import { Block } from "../model/Block";
import { SectionParser } from "../parser/SectionParser";

export class TaskListSorter {
    constructor(
        private readonly parser: SectionParser,
        private readonly taskTester: TaskTester,
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
            this.taskTester.isTask(b.text)
        );
        const [complete, incomplete] = partition(tasks, (b) =>
            this.taskTester.isCompletedTask(b.text)
        );
        root.children = [...nonTasks, ...incomplete, ...complete];

        for (const child of root.children) {
            this.sortBlocksRecursively(child);
        }
    }
}
