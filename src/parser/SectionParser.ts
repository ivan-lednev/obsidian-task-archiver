import { BlockParser } from "./BlockParser";
import { Section } from "../model/Section";
import { TreeBuilder } from "./TreeBuilder";
import { ParserSettings } from "./ParserSettings";

interface RawSection {
    text: string;
    level: number;
    lines: string[];
}

export class SectionParser {
    private readonly HEADING = /^(?<headingToken>#+)\s.*$/;

    constructor(private readonly settings: ParserSettings) {}

    parse(lines: string[]) {
        const flatSectionsWithRawContent = this.parseRawSections(lines);
        const flatSectionsWithParsedContent = this.parseBlocksInSections(
            flatSectionsWithRawContent
        );

        const [root, children] = [
            flatSectionsWithParsedContent[0],
            flatSectionsWithParsedContent.slice(1),
        ];

        new TreeBuilder().buildTree(root, children, () => true);

        return root;
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
        return raw.map((s) => {
            return new Section(
                s.text,
                s.level,
                new BlockParser(this.settings).parse(s.lines)
            );
        });
    }
}
