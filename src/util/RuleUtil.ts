import { Workspace } from "obsidian";

import { isEmpty } from "lodash/fp";

import { Rule, RuleAction } from "../Settings";
import { Block } from "../model/Block";
import { DEFAULT_INCOMPLETE_TASK_PATTERN } from "../Patterns";

function getTaskStatus(task: Block) {
    const [, taskStatus] = task.text.match(/\[(.)]/);
    return taskStatus;
}

export function doesRuleMatchTaskStatus(rule: Rule, task: Block) {
    if (rule.statuses) {
        return rule.statuses.includes(getTaskStatus(task));
    }

    return !DEFAULT_INCOMPLETE_TASK_PATTERN.test(task.text);
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
    return (
        rule.defaultArchiveFileName.trim().length > 0 ||
        rule.ruleAction === RuleAction.DELETE
    );
}

export function doesRuleMatch(rule: Rule, task: Block, workspace: Workspace) {
    return doesRuleMatchTaskStatus(rule, task) &&
        doesStringOfPatternsMatchText(rule.pathPatterns, workspace.getActiveFile().path) &&
        doesStringOfPatternsMatchText(rule.textPatterns, task.text);
}
