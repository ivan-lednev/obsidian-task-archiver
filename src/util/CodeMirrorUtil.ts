import { Editor, EditorPosition } from "obsidian";

import {
    HEADING_PATTERN,
    LIST_ITEM_PATTERN,
    STRING_WITH_SPACES_PATTERN,
} from "../Patterns";

export function detectHeadingUnderCursor(editor: Editor) {
    let thisHeadingStartLineNumber = null;
    let thisHeadingLevel = null;

    for (
        let lookingAtLineNumber = editor.getCursor().line;
        lookingAtLineNumber >= 0;
        lookingAtLineNumber--
    ) {
        const lookingAtLine = editor.getLine(lookingAtLineNumber);
        const headingMatch = lookingAtLine.match(HEADING_PATTERN);
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

    return thisHeadingRange;
}

export function detectListItemUnderCursor(editor: Editor) {
    let thisListStartLineNumber = null;

    for (
        let lookingAtLineNumber = editor.getCursor().line;
        lookingAtLineNumber >= 0;
        lookingAtLineNumber--
    ) {
        const lookingAtLine = editor.getLine(lookingAtLineNumber);
        if (!isListItem(lookingAtLine) && !isIndentedLine(lookingAtLine)) {
            break;
        }
        thisListStartLineNumber = lookingAtLineNumber;
        // todo: tidy up
        if (isListItem(lookingAtLine)) {
            break;
        }
    }

    if (thisListStartLineNumber === null) {
        return null;
    }

    const spacesRegex = /^(\s*).*/;
    const thisListItemIndentationLength = editor
        .getLine(thisListStartLineNumber)
        .replace(spacesRegex, "$1").length;
    const thisListSubItemIndentationPattern = new RegExp(
        `^\\s{${thisListItemIndentationLength + 1},}`
    );
    const lineBelowListStart = thisListStartLineNumber + 1;
    let thisListLastLineNumber = thisListStartLineNumber;

    for (
        let lookingAtLineNumber = lineBelowListStart;
        lookingAtLineNumber <= editor.lastLine();
        lookingAtLineNumber++
    ) {
        const lookingAtLine = editor.getLine(lookingAtLineNumber);
        if (!thisListSubItemIndentationPattern.test(lookingAtLine)) {
            break;
        }
        thisListLastLineNumber = lookingAtLineNumber;
    }

    if (thisListLastLineNumber === null) {
        return null;
    }

    const lineAfterListNumber = thisListLastLineNumber + 1;

    const thisListRange: [EditorPosition, EditorPosition] = [
        { line: thisListStartLineNumber, ch: 0 },
        {
            line: lineAfterListNumber,
            ch: 0,
        },
    ];
    return thisListRange;
}

export function detectListUnderCursor(editor: Editor) {
    let thisListStartLineNumber = null;

    for (
        let lookingAtLineNumber = editor.getCursor().line;
        lookingAtLineNumber >= 0;
        lookingAtLineNumber--
    ) {
        const lookingAtLine = editor.getLine(lookingAtLineNumber);
        if (!isListItem(lookingAtLine) && !isIndentedLine(lookingAtLine)) {
            break;
        }
        thisListStartLineNumber = lookingAtLineNumber;
    }

    if (thisListStartLineNumber === null) {
        return null;
    }

    const lineBelowListStart = thisListStartLineNumber + 1;
    let thisListLastLineNumber = thisListStartLineNumber;

    for (
        let lookingAtLineNumber = lineBelowListStart;
        lookingAtLineNumber <= editor.lastLine();
        lookingAtLineNumber++
    ) {
        const lookingAtLine = editor.getLine(lookingAtLineNumber);
        if (!isListItem(lookingAtLine) && !isIndentedLine(lookingAtLine)) {
            break;
        }
        thisListLastLineNumber = lookingAtLineNumber;
    }

    if (thisListLastLineNumber === null) {
        return null;
    }

    const thisListRange: [EditorPosition, EditorPosition] = [
        { line: thisListStartLineNumber, ch: 0 },
        {
            line: thisListLastLineNumber,
            ch: editor.getLine(thisListLastLineNumber).length,
        },
    ];
    return thisListRange;
}

function isListItem(line: string) {
    return LIST_ITEM_PATTERN.test(line);
}

function isIndentedLine(line: string) {
    return STRING_WITH_SPACES_PATTERN.test(line);
}
