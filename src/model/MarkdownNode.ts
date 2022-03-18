export abstract class MarkdownNode<C extends MarkdownNode<C>> {
    children: C[];
    text: string | null;
    level: number;

    protected constructor(text: string, level: number) {
        this.text = text;
        this.level = level;
        this.children = [];
    }

    appendChild(child: C) {
        this.children.push(child);
    }

    prependChild(child: C) {
        this.children.unshift(child);
    }

    removeChild(child: C) {
        this.children.splice(this.children.indexOf(child), 1);
    }

    abstract stringify(): string[];
}
