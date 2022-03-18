import { BlockParser } from "./BlockParser";
import { Section } from "../model/Section";

export interface ParserSettings {
    useTab: boolean;
    tabSize: number;
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
        SectionParser.buildTree(root, children);

        return root;
    }

    private parseRawSections(lines: string[]) {
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

    private static buildTree(root: Section, flatSections: Section[]) {
        // TODO: duplicated
        let contextStack = [root];
        for (const section of flatSections) {
            const stepsToGoUp = contextStack.length - section.level;
            if (stepsToGoUp >= 0) {
                for (let i = 0; i < stepsToGoUp; i++) {
                    try {
                        contextStack.pop();
                    } catch {
                        throw new Error(
                            "No more context levels to pop. Looks like the user jumped multiple levels of indentation"
                        );
                    }
                }
            }

            contextStack[contextStack.length - 1].appendChild(section);
            contextStack.push(section);
        }
    }
}

// TODO: implement
interface RawSection {
    text: string;
    level: number;
    lines: string[];
}
