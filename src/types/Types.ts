import { Rule } from "../Settings";
import { Block } from "../model/Block";
import { Section } from "../model/Section";

export interface BlockExtractor {
    (root: Block, filter: BlockFilter): Block[];
}

interface BlockFilter {
    (block: Block): boolean;
}

interface SectionFilter {
    (section: Section): boolean;
}

export interface TreeFilter {
    blockFilter: BlockFilter;
    sectionFilter: SectionFilter;
}

export interface TreeEditorCallback {
    (tree: Section): void;
}

export interface BlockWithRule {
    task: Block;
    rule?: Rule;
}

export interface TaskWithResolvedDestination {
    task: Block;
    resolvedPath: string;
    resolvedHeadings: string[];
    resolvedListItems: string[];
}
