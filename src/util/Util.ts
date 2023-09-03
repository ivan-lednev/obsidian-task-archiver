import { flow, isEmpty, last, partition } from "lodash";
import { dropRightWhile, dropWhile } from "lodash/fp";

import { DEFAULT_DATE_FORMAT } from "../Constants";
import {
    INDENTATION_PATTERN,
    OBSIDIAN_TASKS_COMPLETED_DATE_PATTERN,
} from "../Patterns";
import { IndentationSettings, Settings } from "../Settings";
import { Block } from "../model/Block";
import { Section } from "../model/Section";
import { TextBlock } from "../model/TextBlock";
import { TreeFilter } from "../model/TreeFilter";
import { BlockExtractor } from "../types/Types";

export function buildIndentation(settings: IndentationSettings) {
    return settings.useTab ? "\t" : " ".repeat(settings.tabSize);
}

function findBlockRecursivelyInCollection(
    blocks: Block[],
    matcher: (node: Block) => boolean
) {
    for (const block of blocks) {
        if (matcher(block)) {
            return block;
        }
        const found = findBlockRecursively(block, matcher);
        if (found !== null) {
            return found;
        }
    }
    return null;
}

export function findBlockRecursively(
    blocksOrBlock: Block[] | Block,
    matcher: (node: Block) => boolean
): Block | null {
    if (blocksOrBlock instanceof Block) {
        if (matcher(blocksOrBlock)) {
            return blocksOrBlock;
        }
        return findBlockRecursivelyInCollection(blocksOrBlock.children, matcher);
    }
    return findBlockRecursivelyInCollection(blocksOrBlock, matcher);
}

interface SectionMatcher {
    (section: Section): boolean;
}

export function findSectionRecursively(
    root: Section,
    matcher: SectionMatcher
): Section | null {
    if (matcher(root)) {
        return root;
    }
    if (isEmpty(root.children)) {
        return null;
    }
    for (const child of root.children) {
        const result = findSectionRecursively(child, matcher);
        if (result) {
            return result;
        }
    }
    return null;
}

export function addNewlinesToSection(section: Section) {
    let lastSection = section;
    const childrenLength = section.children.length;
    if (childrenLength > 0) {
        lastSection = last(section.children);
    }
    const blocksLength = lastSection.blockContent.children.length;
    if (blocksLength > 0) {
        const lastBlock = last(lastSection.blockContent.children);
        if (lastBlock.text.trim().length !== 0) {
            lastSection.blockContent.appendChild(new TextBlock(""));
        }
    }
}

export function normalizeNewlinesRecursively(root: Section) {
    for (const child of root.children) {
        child.blockContent.children = normalizeNewlines(child.blockContent.children);
        normalizeNewlinesRecursively(child);
    }
}

export const stripSurroundingNewlines = flow(
    dropWhile(isEmptyBlock),
    dropRightWhile(isEmptyBlock)
);

function isEmptyBlock(block: Block) {
    return block.text.trim().length === 0;
}

export function addSurroundingNewlines(blocks: Block[]) {
    const newLine = new TextBlock("");
    if (isEmpty(blocks)) {
        return [newLine];
    }
    return [newLine, ...blocks, newLine];
}

export function normalizeNewlines(blocks: Block[]) {
    return addSurroundingNewlines(stripSurroundingNewlines(blocks));
}

export function splitOnIndentation(line: string) {
    const indentationMatch = line.match(INDENTATION_PATTERN);
    const indentation = indentationMatch[0];
    const text = line.substring(indentation.length);
    return [indentation, text];
}

export function shallowExtractBlocks(root: Block, filter: (block: Block) => boolean) {
    const [extracted, theRest] = partition(root.children, filter);
    root.children = theRest;
    return extracted;
}

export function deepExtractBlocks(root: Block, filter: (block: Block) => boolean) {
    const extracted = shallowExtractBlocks(root, filter);
    for (const subTree of root.children) {
        extracted.push(...deepExtractBlocks(subTree, filter));
    }
    return extracted;
}

interface ExtractStrategy {
    filter: TreeFilter;
    extractor: BlockExtractor;
}

export function extractBlocksRecursively(
    root: Section,
    { filter, extractor }: ExtractStrategy
): Block[] {
    const extracted = extractor(root.blockContent, filter.blockFilter);

    for (const section of root.children) {
        if (!filter.sectionFilter || filter.sectionFilter(section)) {
            extracted.push(...extractBlocksRecursively(section, { filter, extractor }));
        }
    }
    return extracted;
}

export function getTaskCompletionDate(text?: string) {
    const now = window.moment().format(DEFAULT_DATE_FORMAT);

    const match = text?.match?.(OBSIDIAN_TASKS_COMPLETED_DATE_PATTERN);
    if (match) {
        const [, obsidianTasksCompletedDate] = match;
        return obsidianTasksCompletedDate;
    }

    return now;
}

export function createDefaultRule(settings: Settings) {
    return {
        archiveToSeparateFile: settings.archiveToSeparateFile,
        defaultArchiveFileName: settings.defaultArchiveFileName,
        dateFormat: settings.dateFormat,
        obsidianTasksCompletedDateFormat: DEFAULT_DATE_FORMAT,
        statuses: "", // todo: this belongs to a separate object
        pathPatterns: "", // todo: this belongs to a separate object
    };
}
