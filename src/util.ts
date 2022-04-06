import { IndentationSettings } from "./archiver/IndentationSettings";
import { Block } from "./model/Block";
import { Section } from "./model/Section";
import { last } from "lodash";
import { TextBlock } from "./model/TextBlock";
import { Editor, EditorPosition } from "obsidian";

const headingPattern = /^(#+)\s/;

export function buildIndentation(settings: IndentationSettings) {
    return settings.useTab ? "\t" : " ".repeat(settings.tabSize);
}

export function findBlockRecursively(
    blocksOrBlock: Block[] | Block,
    matcher: (node: Block) => boolean
): Block | null {
    if (blocksOrBlock instanceof Block) {
        if (matcher(blocksOrBlock)) {
            return blocksOrBlock;
        }
        return findBlockRecursivelyInCollection(blocksOrBlock.children, matcher);
    }
    return findBlockRecursivelyInCollection(blocksOrBlock, matcher);
}

function findBlockRecursivelyInCollection(
    blocks: Block[],
    matcher: (node: Block) => boolean
) {
    for (const block of blocks) {
        if (matcher(block)) {
            return block;
        }
        const found = findBlockRecursively(block, matcher);
        if (found !== null) {
            return found;
        }
    }
    return null;
}

export function addNewlinesToSection(section: Section) {
    let lastSection = section;
    const childrenLength = section.children.length;
    if (childrenLength > 0) {
        lastSection = last(section.children);
    }
    const blocksLength = lastSection.blockContent.children.length;
    if (blocksLength > 0) {
        const lastBlock = last(lastSection.blockContent.children);
        if (lastBlock.text.trim().length !== 0) {
            lastSection.blockContent.appendChild(new TextBlock(""));
        }
    }
}

export function deleteHeadingUnderCursor(editor: Editor) {
    let thisHeadingStartLineNumber = null;
    let thisHeadingLevel = null;

    for (
        let lookingAtLineNumber = editor.getCursor().line;
        lookingAtLineNumber >= 0;
        lookingAtLineNumber--
    ) {
        const lookingAtLine = editor.getLine(lookingAtLineNumber);
        const headingMatch = lookingAtLine.match(headingPattern);
        if (headingMatch) {
            thisHeadingStartLineNumber = lookingAtLineNumber;
            const [, headingToken] = headingMatch;
            thisHeadingLevel = headingToken.length;
            break;
        }
    }

    if (thisHeadingStartLineNumber === null) {
        return null;
    }

    const higherOrEqualHeadingPattern = new RegExp(`^#{1,${thisHeadingLevel}}\\s`);
    const lineBelowHeadingStart = thisHeadingStartLineNumber + 1;
    let thisHeadingLastLineNumber = thisHeadingStartLineNumber;

    for (
        let lookingAtLineNumber = lineBelowHeadingStart;
        lookingAtLineNumber <= editor.lastLine();
        lookingAtLineNumber++
    ) {
        const lookingAtLine = editor.getLine(lookingAtLineNumber);
        const isLineHigherOrEqualHeading =
            higherOrEqualHeadingPattern.test(lookingAtLine);
        if (isLineHigherOrEqualHeading) {
            break;
        }
        thisHeadingLastLineNumber = lookingAtLineNumber;
    }

    if (thisHeadingLastLineNumber === null) {
        return null;
    }

    const thisHeadingRange: [EditorPosition, EditorPosition] = [
        { line: thisHeadingStartLineNumber, ch: 0 },
        {
            line: thisHeadingLastLineNumber,
            ch: editor.getLine(thisHeadingLastLineNumber).length,
        },
    ];

    const thisHeadingLines = editor.getRange(...thisHeadingRange).split("\n");
    editor.replaceRange("", ...thisHeadingRange);
    return thisHeadingLines;
}
