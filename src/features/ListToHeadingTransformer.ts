import { Editor } from "obsidian";

import { Settings } from "../Settings";
import { Block } from "../model/Block";
import { RootBlock } from "../model/RootBlock";
import { Section } from "../model/Section";
import { BlockParser } from "../parser/BlockParser";
import { SectionParser } from "../parser/SectionParser";
import {
    detectHeadingUnderCursor,
    detectListUnderCursor,
} from "../util/CodeMirrorUtil";
import { buildIndentation, normalizeNewlinesRecursively } from "../util/Util";

export class ListToHeadingTransformer {
    constructor(
        private readonly parser: SectionParser,
        private readonly settings: Settings
    ) {}

    turnListItemsIntoHeadings(editor: Editor) {
        const thisListRange = detectListUnderCursor(editor);
        if (thisListRange === null) {
            return;
        }

        const thisListLines = editor.getRange(...thisListRange).split("\n");

        const parsedRoot = this.parser.parse(thisListLines);

        const newSectionRoot = buildSectionFromList(parsedRoot.blockContent);
        replaceChildBlocksWithChildSectionsRecursively(
            newSectionRoot,
            this.getDepthOfLineUnderCursor(editor)
        );

        const parentHeadingTokenLevel = this.getHeadingTokenLevelUnderCursor(editor);
        newSectionRoot.recalculateTokenLevels(parentHeadingTokenLevel);

        if (this.settings.addNewlinesAroundHeadings) {
            normalizeNewlinesRecursively(newSectionRoot);
        }

        const newListLines = newSectionRoot
            .stringify(buildIndentation(this.settings.indentationSettings))
            .join("\n");

        editor.replaceRange(newListLines, ...thisListRange);
    }

    private getDepthOfLineUnderCursor(editor: Editor) {
        const line = editor.getLine(editor.getCursor().line);
        // TODO: kludge. This is not a good reason to create a parser
        return new BlockParser(this.settings.indentationSettings).getIndentationLevel(
            line
        );
    }

    private getHeadingTokenLevelUnderCursor(editor: Editor) {
        const headingUnderCursor = detectHeadingUnderCursor(editor);
        if (headingUnderCursor === null) {
            return 0;
        }
        const emptyRootSectionUnderCursor = this.parser.parse(
            editor.getRange(...headingUnderCursor).split("\n")
        );
        const actualSectionUnderCursor = emptyRootSectionUnderCursor.children[0];
        return actualSectionUnderCursor.tokenLevel;
    }
}

function replaceChildBlocksWithChildSectionsRecursively(
    section: Section,
    maxReplacementDepth: number,
    currentDepth = 1 // TODO: again, implicit knowledge about levels
) {
    if (currentDepth > maxReplacementDepth) {
        return;
    }
    for (const blockChild of section.blockContent.children) {
        section.appendChild(buildSectionFromList(blockChild));
    }
    section.blockContent.children = [];

    for (const child of section.children) {
        replaceChildBlocksWithChildSectionsRecursively(
            child,
            maxReplacementDepth,
            currentDepth + 1
        );
    }
}

function buildSectionFromList(listRoot: Block) {
    const newBlockContent = new RootBlock();
    newBlockContent.children = listRoot.children;
    // TODO: this regex is out of place
    const sectionText = listRoot.text.replace(
        /^(?<bullet>[-*+]|\d+\.)(?<task> \[[x ]])?/,
        ""
    );
    return new Section(sectionText, 0, newBlockContent);
}
