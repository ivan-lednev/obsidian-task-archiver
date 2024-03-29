import { last } from "lodash";

import { ListBlock } from "../../model/ListBlock";
import { MarkdownNode } from "../../model/MarkdownNode";
import { Section } from "../../model/Section";

export interface FlatNode<T extends MarkdownNode<T>> {
    markdownNode: T;
    level: number;
}

export class TreeBuilder<L extends MarkdownNode<L>> {
    private readonly contextStack: FlatNode<L>[] = [];

    buildTree(root: FlatNode<L>, nodes: FlatNode<L>[]) {
        this.contextStack.push(root);
        for (const node of nodes) {
            this.adjustContextTo(node.level);
            this.appendChildToContext(node.markdownNode);
            if (this.canBeContext(node.markdownNode)) {
                this.contextStack.push(node);
            }
        }
    }

    private adjustContextTo(level: number) {
        const actualLevelOfNesting = this.contextStack.length;
        const stepsToGoUp = actualLevelOfNesting - level;
        if (stepsToGoUp >= 0) {
            this.clearStack(stepsToGoUp);
        }
    }

    private canBeContext(node: L) {
        return node instanceof ListBlock || node instanceof Section;
    }

    private appendChildToContext(child: L) {
        const { markdownNode } = last(this.contextStack);
        // todo: mutation
        child.parent = markdownNode;
        markdownNode.appendChild(child);
    }

    private clearStack(levels: number) {
        for (let i = 0; i < levels; i++) {
            this.contextStack.pop();
        }
    }
}
