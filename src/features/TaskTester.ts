import { DEFAULT_COMPLETED_TASK_PATTERN, DEFAULT_TASK_PATTERN } from "../Patterns";
import { Settings } from "../Settings";

export class TaskTester {
    private readonly initialPattern: string;
    private compiledPattern: RegExp;

    constructor(private readonly settings: Settings) {
        this.initialPattern = settings.additionalTaskPattern;
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

    private doesMatchAdditionalTaskPattern(line: string) {
        if (!this.settings.additionalTaskPattern) {
            return true;
        }
        this.refreshPattern();
        return this.compiledPattern.test(line);
    }

    private refreshPattern() {
        if (this.initialPattern === this.settings.additionalTaskPattern) {
            return;
        }
        this.compiledPattern = new RegExp(this.settings.additionalTaskPattern);
    }
}
