const FRONT_MATTER_DELIMITER = "---";

export function splitFrontMatter(lines: string[]) {
    const [firstLine, ...linesAfterFirst] = lines;

    if (firstLine.trimEnd() !== FRONT_MATTER_DELIMITER) {
        return [[], lines];
    }

    const closingDelimiterIndexMinusFirstLine = linesAfterFirst.findIndex(
        (line) => line.trimEnd() === FRONT_MATTER_DELIMITER
    );

    if (closingDelimiterIndexMinusFirstLine < 0) {
        throw new Error(
            `Front matter started, but there was no closing delimiter: ${lines.join(
                "\n"
            )}`
        );
    }

    const frontMatterLastLineIndex = closingDelimiterIndexMinusFirstLine + 1;
    const documentStartIndex = frontMatterLastLineIndex + 1;

    const frontMatterLines = lines.slice(0, documentStartIndex);
    const documentLines = lines.slice(documentStartIndex);

    return [frontMatterLines, documentLines];
}
