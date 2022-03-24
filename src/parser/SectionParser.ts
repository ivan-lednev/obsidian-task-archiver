import { BlockParser } from "./BlockParser";
import { Section } from "../model/Section";
import { TreeBuilder } from "./TreeBuilder";
import { IndentationSettings } from "../archiver/IndentationSettings";
import { Block } from "../model/Block";

interface RawSection {
    text: string;
    level: number;
    lines: string[];
}

export class SectionParser {
    private readonly HEADING = /^(?<headingToken>#+)\s.*$/;

    constructor(private readonly indentationSettings: IndentationSettings) {}

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
        // TODO: kludge for null
        const sections: RawSection[] = [{ text: null, level: 0, lines: [] }];

        for (const line of lines) {
            const match = line.match(this.HEADING);
            if (match) {
                sections.push({
                    text: match[0],
                    level: match.groups.headingToken.length,
                    lines: [],
                });
            } else {
                const lastSection = sections[sections.length - 1];
                lastSection.lines.push(line);
            }
        }

        return sections;
    }

    private parseBlocksInSections(raw: RawSection[]) {
        // TODO: don't nest different objects in one go: split Section creation from parsing blocks?
        const blockParser = new BlockParser(this.indentationSettings);
        return raw.map((s) => {
            return {
                markdownNode: new Section(s.text, blockParser.parse(s.lines)),
                level: s.level,
                isContext: true,
            };
        });
    }
}
