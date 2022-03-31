import { Block } from "./Block";
import { Section } from "./Section";

export interface TreeFilter {
    sectionFilter?(section: Section): boolean;
    blockFilter(block: Block): boolean;
}