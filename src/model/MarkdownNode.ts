// todo: don't need generics here
export abstract class MarkdownNode<C extends MarkdownNode<C>> {
    children: C[];

    parent: C;

    text: string;

    constructor(text: string) {
        this.text = text;
        this.children = [];
    }

    prependChild(child: C) {
        this.children.unshift(child);
    }

    appendChild(child: C) {
        this.children.push(child);
    }

    abstract stringify(indentation: string): string[];
}
