import { BlockParser } from "./BlockParser";
import { Section } from "../model/Section";
import { TreeBuilder } from "./TreeBuilder";
import { last } from "lodash";

interface RawSection {
    text: string;
    level: number;
    lines: string[];
}

export class SectionParser {
    private readonly HEADING = /^(#+)(\s.*)$/;

    constructor(private readonly blockParser: BlockParser) {}

    parse(lines: string[]) {
        const flatSectionsWithRawContent = this.parseRawSections(lines);
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

    private parseRawSections(lines: string[]) {
        const sections: RawSection[] = [{ text: "", level: 0, lines: [] }];

        for (const line of lines) {
            const match = line.match(this.HEADING);
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

    private parseBlocksInSections(raw: RawSection[]) {
        // TODO: don't nest different objects in one go: split Section creation from parsing blocks?
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
