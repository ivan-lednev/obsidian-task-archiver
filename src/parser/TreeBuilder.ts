import { MarkdownNode } from "../model/MarkdownNode";
import { ListBlock } from "../model/ListBlock";
import { Section } from "../model/Section";

export interface FlatNode<T extends MarkdownNode<T>> {
    markdownNode: T;
    level: number;
}

export class TreeBuilder<L extends MarkdownNode<L>> {
    private readonly contextStack: FlatNode<L>[] = [];

    buildTree(root: FlatNode<L>, nodes: FlatNode<L>[]) {
        this.contextStack.push(root);
        for (const node of nodes) {
            const actualLevelOfNesting = this.contextStack.length;
            const stepsToGoUp = actualLevelOfNesting - node.level;
            if (stepsToGoUp >= 0) {
                this.clearStack(stepsToGoUp);
            }
            this.appendChild(node.markdownNode);
            if (
                node.markdownNode instanceof ListBlock ||
                node.markdownNode instanceof Section
            ) {
                this.contextStack.push(node);
            }
        }
        return root;
    }

    private appendChild(section: L) {
        this.contextStack[this.contextStack.length - 1].markdownNode.appendChild(
            section
        );
    }

    private clearStack(levels: number) {
        for (let i = 0; i < levels; i++) {
            this.contextStack.pop();
        }
    }
}
