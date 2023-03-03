import { cloneDeep } from "lodash";

import { BlockWithRule } from "./Archiver";
import { PlaceholderResolver } from "./PlaceholderResolver";

import { Settings } from "../Settings";
import { Block } from "../model/Block";

export class MetadataService {
    constructor(
        private readonly placeholderResolver: PlaceholderResolver,
        private readonly settings: Settings
    ) {}

    appendMetadata({ task, rule }: BlockWithRule) {
        if (!this.settings.additionalMetadataBeforeArchiving.addMetadata) {
            return { task, rule };
        }

        const { metadata, dateFormat } = {
            ...this.settings.additionalMetadataBeforeArchiving,
            ...rule,
        };

        const resolvedMetadata = this.placeholderResolver.resolve(
            metadata,
            dateFormat,
            task.parentSection.text
        );

        task.text = `${task.text} ${resolvedMetadata}`;
        return { task, rule };
    }
}
