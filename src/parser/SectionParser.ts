import { BlockParser } from "./BlockParser";
import { Section } from "../model/Section";
import { TreeBuilder } from "./TreeBuilder";
import { HEADING_PATTERN } from "../Patterns";
import { last } from "lodash";

interface RawSection {
    text: string;
    level: number;
    lines: string[];
}

export class SectionParser {
    constructor(private readonly blockParser: BlockParser) {}

    private static parseRawSections(lines: string[]) {
        const sections: RawSection[] = [{ text: "", level: 0, lines: [] }];

        for (const line of lines) {
            const match = line.match(HEADING_PATTERN);
            if (match) {
                const [, headingToken, text] = match;
                sections.push({
                    text,
                    level: headingToken.length,
                    lines: [],
                });
            } else {
                last(sections).lines.push(line);
            }
        }

        return sections;
    }

    parse(lines: string[]) {
        const flatSectionsWithRawContent = SectionParser.parseRawSections(lines);
        const flatSectionsWithParsedContent = this.parseBlocksInSections(
            flatSectionsWithRawContent
        );

        const [root, children] = [
            flatSectionsWithParsedContent[0],
            flatSectionsWithParsedContent.slice(1),
        ];

        new TreeBuilder().buildTree(root, children);

        return root.markdownNode;
    }

    private parseBlocksInSections(raw: RawSection[]) {
        return raw.map((s) => {
            return {
                markdownNode: new Section(
                    s.text,
                    s.level,
                    this.blockParser.parse(s.lines)
                ),
                level: s.level,
            };
        });
    }
}
