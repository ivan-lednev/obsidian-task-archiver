export abstract class MarkdownNode<C extends MarkdownNode<C>> {
    children: C[];
    text: string | null;

    constructor(text: string) {
        this.text = text;
        this.children = [];
    }

    appendChild(child: C) {
        this.children.push(child);
    }

    prependChild(child: C) {
        this.children.unshift(child);
    }

    abstract stringify(indentation: string): string[];
}
