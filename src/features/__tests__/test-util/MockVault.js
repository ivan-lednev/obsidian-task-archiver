export class MockVault {
    constructor(files) {
        this.files = files;
    }

    read(file) {
        return file.state.join("\n");
    }

    modify(file, contents) {
        file.state = contents.split("\n");
    }

    getAbstractFileByPath(path) {
        const found = this.files.find((file) => file.path === path);
        if (!found) {
            throw new Error(`There is no file in the test vault: '${path}'`);
        }
        return found;
    }
}
