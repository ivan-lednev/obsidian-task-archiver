import { Block } from "../model/Block";
import { BlockParser } from "./BlockParser";
import { Section } from "../model/Section";

export interface ParserSettings {
    useTab: boolean;
    tabSize: number;
}

export class SectionParser {
    private readonly HEADING = /^(?<headingToken>#+)\s.*$/;
    private readonly settings: ParserSettings;

    constructor(settings: ParserSettings) {
        this.settings = settings;
    }

    parse(lines: string[]) {
        const rawSections = this.parseRawSections(lines);
        const flatSections = this.parseBlocksInSections(rawSections);

        const [root, children] = [flatSections[0], flatSections.slice(1)];
        this.buildTree(root, children);

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

    private buildTree(root: Section, flatSections: Section[]) {
        let context = root;
        for (const section of flatSections) {
            const stepsUpToSection = context.level - section.level;
            if (stepsUpToSection >= 0) {
                const stepsUpToParent = stepsUpToSection + 1;
                context = this.goUpInNodeChain(stepsUpToParent, context);
            }

            context.append(section);
            context = section;
        }
    }

    goUpInNodeChain(targetLevel: number, node: Section) {
        let pointer = node;

        for (let level = 0; level < targetLevel; level++) {
            pointer = pointer.parent;
        }

        return pointer;
    }
}


interface Node {
    children: Node[];
    text: string | null;
    parent: Node | null;

    append(node: Node): void;

    appendFirst(node: Node): void;

    appendSibling(node: Node): void;

    remove(node: Node): void;

    removeSelf(): void;

    stringify(): string[];
}

interface RawSection {
    text: string;
    level: number;
    lines: string[];
}
