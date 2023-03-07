import { last } from "lodash";

import { BlockParser } from "./BlockParser";
import { TreeBuilder } from "./TreeBuilder";

import { HEADING_PATTERN } from "../../Patterns";
import { Block } from "../../model/Block";
import { Section } from "../../model/Section";

interface RawSection {
    text: string;
    tokenLevel: number;
    lines: string[];
}

function buildRawSectionsFromLines(lines: string[]) {
    const rootSection: RawSection = { text: "", tokenLevel: 0, lines: [] };
    return lines.reduce(
        (sections, line) => {
            const match = line.match(HEADING_PATTERN);
            if (match) {
                const [, headingToken, text] = match;
                sections.push({
                    text,
                    tokenLevel: headingToken.length,
                    lines: [],
                });
            } else {
                last(sections).lines.push(line);
            }
            return sections;
        },
        [rootSection]
    );
}

export class SectionParser {
    constructor(private readonly blockParser: BlockParser) {}

    parse(lines: string[]) {
        const [root, ...flatChildren] = buildRawSectionsFromLines(lines)
            .map((rawSection) => {
                const blockContent = this.blockParser.parse(rawSection.lines);
                const section = new Section(
                    rawSection.text,
                    rawSection.tokenLevel,
                    blockContent
                );
                // todo: mutation
                this.walkBlocksDeep(blockContent, (block) => {
                    block.parentSection = section;
                });
                return section;
            })
            .map((section) => ({
                markdownNode: section,
                level: section.tokenLevel,
            }));

        new TreeBuilder().buildTree(root, flatChildren);
        return root.markdownNode;
    }

    private walkBlocksDeep(block: Block, visitor: (block: Block) => void) {
        visitor(block);
        block.children.forEach((child) => this.walkBlocksDeep(child, visitor));
    }
}
