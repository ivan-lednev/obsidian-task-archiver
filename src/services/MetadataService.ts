import { PlaceholderService } from "./PlaceholderService";

import { Settings } from "../Settings";
import { BlockWithRule } from "../types/Types";

export class MetadataService {
    constructor(
        private readonly placeholderService: PlaceholderService,
        private readonly settings: Settings
    ) {}

    appendMetadata = ({ task, rule }: BlockWithRule) => {
        if (!this.settings.additionalMetadataBeforeArchiving.addMetadata) {
            return { task, rule };
        }

        const { metadata, dateFormat } = {
            ...this.settings.additionalMetadataBeforeArchiving,
            ...rule,
        };

        const resolvedMetadata = this.placeholderService.resolve(metadata, {
            dateFormat,
            heading: task.parentSection.text,
        });

        task.text = `${task.text} ${resolvedMetadata}`;
        return { task, rule };
    };
}
