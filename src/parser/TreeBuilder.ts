import { MarkdownNode } from "../model/MarkdownNode";

export class TreeBuilder<C extends MarkdownNode<C>> {
    private readonly contextStack: C[] = [];

    buildTree(root: C, flatSections: C[], contextPredicate: (node: C) => boolean) {
        this.contextStack.push(root);
        for (const section of flatSections) {
            const stepsToGoUp = this.contextStack.length - section.level;
            if (stepsToGoUp >= 0) {
                this.clearStack(stepsToGoUp);
            }
            this.appendChild(section);
            if (contextPredicate(section)) {
                this.contextStack.push(section);
            }
        }
        return root;
    }

    private appendChild(section: C) {
        this.contextStack[this.contextStack.length - 1].appendChild(section);
    }

    private clearStack(levels: number) {
        for (let i = 0; i < levels; i++) {
            try {
                this.contextStack.pop();
            } catch {
                throw new Error(
                    "No more context levels to pop. Looks like the user jumped multiple levels of indentation"
                );
            }
        }
    }
}
