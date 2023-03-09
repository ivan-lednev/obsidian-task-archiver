export class MockEditor {
    constructor(activeFile) {
        this.activeFile = activeFile;
        this.cursor = { line: 0, ch: 0 };
    }

    getValue() {
        return this.activeFile.state.join("\n");
    }

    setValue(value) {
        this.activeFile.state = value.split("\n");
    }

    getCursor() {
        return this.cursor;
    }

    getLine(n) {
        return this.activeFile.state[n];
    }

    lastLine() {
        return this.activeFile.state.length - 1;
    }

    getRange(from, to) {
        const toLineExclusive = to.line + 1;
        return this.activeFile.state.slice(from.line, toLineExclusive).join("\n");
    }

    replaceRange(replacement, from, to) {
        const newLines = replacement === "" ? [] : replacement.split("\n");
        const deletingWithNewline = to.ch === 0;
        const deleteCount = deletingWithNewline
            ? to.line - from.line
            : to.line - from.line + 1;
        this.activeFile.state.splice(from.line, deleteCount, ...newLines);
    }

    setCursor(pos) {
        this.cursor = pos;
    }
}
