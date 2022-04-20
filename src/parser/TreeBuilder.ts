import { MarkdownNode } from "../model/MarkdownNode";
import { ListBlock } from "../model/ListBlock";
import { Section } from "../model/Section";
import { last } from "lodash";

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

    private appendChildToContext(section: L) {
        last(this.contextStack).markdownNode.appendChild(section);
    }

    private clearStack(levels: number) {
        for (let i = 0; i < levels; i++) {
            this.contextStack.pop();
        }
    }
}
