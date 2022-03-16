export abstract class MarkdownNode {
    children: MarkdownNode[];
    text: string | null;
    parent: MarkdownNode | null;
    level: number;

    protected constructor(text: string, level: number) {
        this.text = text;
        this.level = level;
        this.children = [];
    }

    appendChild(child: MarkdownNode) {
        child.parent = this;
        this.children.push(child);
    }

    prependChild(child: MarkdownNode) {
        this.children.unshift(child);
        child.parent = this;
    }

    removeChild(child: MarkdownNode) {
        child.parent = null;
        this.children.splice(this.children.indexOf(child), 1);
    }

    removeSelf() {
        this.parent.removeChild(this);
    }

    getNthAncestor(targetLevel: number) {
        let pointer = this as MarkdownNode;

        for (let level = 0; level < targetLevel; level++) {
            pointer = pointer.parent;
        }

        return pointer;
    }

    abstract stringify(): string[];
}
