// todo: this is really a fake, not a mock
export class MockVault {
    constructor(files) {
        this.files = files;
    }

    // eslint-disable-next-line class-methods-use-this
    read(file) {
        return file.state.join("\n");
    }

    // eslint-disable-next-line class-methods-use-this
    modify(file, contents) {
        // eslint-disable-next-line no-param-reassign
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
