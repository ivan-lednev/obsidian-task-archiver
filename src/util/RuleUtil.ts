import { isEmpty } from "lodash/fp";

import { Rule } from "../Settings";
import { Block } from "../model/Block";

function getTaskStatus(task: Block) {
    const [, taskStatus] = task.text.match(/\[(.)]/);
    return taskStatus;
}

export function doesRuleMatchTaskStatus(rule: Rule, task: Block) {
    if (isEmpty(rule.statuses)) {
        return true;
    }

    return rule.statuses.includes(getTaskStatus(task));
}

export function doesStringOfPatternsMatchText(patterns: string, text: string) {
    if (isEmpty(patterns)) {
        return true;
    }

    return patterns
        .split("\n")
        .map((pattern) => new RegExp(pattern))
        .some((pattern) => pattern.test(text));
}

export function isRuleActionValid(rule: Rule) {
    return rule.defaultArchiveFileName.trim().length > 0;
}
