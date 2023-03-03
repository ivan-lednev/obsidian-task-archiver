import {
    CHECKED_TASK_PATTERN,
    DEFAULT_COMPLETED_TASK_PATTERN,
    DEFAULT_TASK_PATTERN,
} from "../Patterns";
import { Settings } from "../Settings";

export class TaskTester {
    private compiledPattern: RegExp;

    constructor(private readonly settings: Settings) {
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

    doesTaskNeedArchiving(text: string) {
        if (!this.isCheckedTask(text)) {
            return false;
        }

        if (this.isCompletedTask(text)) {
            return true;
        }

        if (this.settings.archiveAllCheckedTaskTypes) {
            return true;
        }

        return this.isTaskHandledByRule(text);
    }

    private isTaskHandledByRule(text: string) {
        const taskStatus = this.getTaskStatus(text);
        const statusesFromRules = this.settings.rules
            .map((rule) => rule.statuses)
            .join("");

        return statusesFromRules.includes(taskStatus);
    }

    // todo: remove duplication
    // todo: move to parsing
    private getTaskStatus(text: string) {
        const [, taskStatus] = text.match(/\[(.)]/);
        return taskStatus;
    }

    private doesMatchAdditionalTaskPattern(line: string) {
        if (!this.settings.additionalTaskPattern) {
            return true;
        }
        return this.compiledPattern.test(line);
    }
}
