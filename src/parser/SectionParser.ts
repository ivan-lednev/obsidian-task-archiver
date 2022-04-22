import { last } from "lodash";

import { BlockParser } from "./BlockParser";
import { TreeBuilder } from "./TreeBuilder";

import { HEADING_PATTERN } from "../Patterns";
import { Section } from "../model/Section";

function buildRawSectionsFromLines(lines: string[]) {
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
        [{ text: "", tokenLevel: 0, lines: [] }]
    );
}

export class SectionParser {
    constructor(private readonly blockParser: BlockParser) {}

    parse(lines: string[]) {
        const [root, ...flatChildren] = buildRawSectionsFromLines(lines)
            .map(
                (rawSection) =>
                    new Section(
                        rawSection.text,
                        rawSection.tokenLevel,
                        this.blockParser.parse(rawSection.lines)
                    )
            )
            .map((section) => ({
                markdownNode: section,
                level: section.tokenLevel,
            }));

        new TreeBuilder().buildTree(root, flatChildren);
        return root.markdownNode;
    }
}
