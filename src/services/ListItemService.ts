import { sortBy } from "lodash";

import { PlaceholderService } from "./PlaceholderService";

import { IndentationSettings, Settings, TaskSortOrder } from "../Settings";
import { Block } from "../model/Block";
import { ListBlock } from "../model/ListBlock";
import {
    addSurroundingNewlines,
    findBlockRecursively,
    stripSurroundingNewlines,
} from "../util/Util";

export class ListItemService {
    private readonly indentationSettings: IndentationSettings;

    constructor(
        private readonly placeholderService: PlaceholderService,
        private readonly settings: Settings
    ) {
        this.indentationSettings = settings.indentationSettings;
    }

    mergeBlocksWithListItemTree(root: Block, newBlocks: Block[]) {
        root.children = stripSurroundingNewlines(root.children);
        const insertionPoint = this.getArchiveLeaf(root);
        this.addChildren(insertionPoint, ...newBlocks);

        if (this.settings.sortAlphabetically) {
            insertionPoint.children = sortBy(
                insertionPoint.children,
                (child) => child.text
            );
        }

        if (this.settings.addNewlinesAroundHeadings) {
            root.children = addSurroundingNewlines(root.children);
        }
    }

    private getArchiveLeaf(root: Block) {
        if (!this.settings.archiveUnderListItems) {
            return root;
        }

        const resolvedListItems = this.settings.listItems.map((l) =>
            this.placeholderService.resolve(l.text, l.dateFormat)
        );

        let context = root;
        for (const listItem of resolvedListItems) {
            const foundListItem = findBlockRecursively(
                context.children,
                (b) => b.text.includes(listItem) // todo: there should be a full match
            );

            if (foundListItem) {
                context = foundListItem;
            } else {
                const newBlock = new ListBlock(`- ${listItem}`); // todo: don't add tokens manually
                this.addChildren(context, newBlock);
                context = newBlock;
            }
        }
        return context;
    }

    private addChildren(block: Block, ...children: Block[]) {
        block.children =
            this.settings.taskSortOrder === TaskSortOrder.NEWEST_FIRST
                ? [...children, ...block.children]
                : [...block.children, ...children];
    }
}
