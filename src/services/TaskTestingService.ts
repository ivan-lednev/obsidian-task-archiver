import { Workspace } from "obsidian";

import {
    CHECKED_TASK_PATTERN,
    DEFAULT_COMPLETED_TASK_PATTERN,
    DEFAULT_INCOMPLETE_TASK_PATTERN,
    DEFAULT_TASK_PATTERN,
} from "../Patterns";
import { Settings } from "../Settings";
import { Block } from "../model/Block";
import { findBlockRecursively } from "../util/Util";
import { doesRuleMatch } from "../util/RuleUtil";

export class TaskTestingService {
    private compiledPattern: RegExp;

    constructor(
        private readonly workspace: Workspace,
        private readonly settings: Settings
    ) {
        this.compiledPattern = new RegExp(this.settings.additionalTaskPattern);
    }

    isTask(line: string) {
        return (
            DEFAULT_TASK_PATTERN.test(line) && this.doesMatchAdditionalTaskPattern(line)
        );
    }

    isCompletedTask(line: string) {
        return (
            DEFAULT_COMPLETED_TASK_PATTERN.test(line) &&
            this.doesMatchAdditionalTaskPattern(line)
        );
    }

    private isCheckedTask(line: string) {
        return (
            CHECKED_TASK_PATTERN.test(line) && this.doesMatchAdditionalTaskPattern(line)
        );
    }

    doesTaskNeedArchiving(task: Block) {
        if (!this.isTask(task.text)) {
            return false;
        }

        if (this.settings.archiveOnlyIfSubtasksAreDone) {
            const incompleteNestedTask = findBlockRecursively(
                task,
                (block) =>
                    block !== task && DEFAULT_INCOMPLETE_TASK_PATTERN.test(block.text)
            );

            if (incompleteNestedTask) {
                return false;
            }
        }

        if (this.isTaskHandledByRule(task)) {
            return true;
        }

        if (!this.isCheckedTask(task.text)) {
            return false;
        }

        if (this.isCompletedTask(task.text)) {
            return true;
        }

        return this.settings.archiveAllCheckedTaskTypes;
    }

    private isTaskHandledByRule(task: Block) {
        return this.settings.rules.some((rule) => doesRuleMatch(rule, task, this.workspace));
    }

    private doesMatchAdditionalTaskPattern(line: string) {
        if (!this.settings.additionalTaskPattern) {
            return true;
        }
        return this.compiledPattern.test(line);
    }
}
