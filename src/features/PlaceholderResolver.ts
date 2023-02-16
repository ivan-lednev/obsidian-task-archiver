import { Workspace } from "obsidian";

export class PlaceholderResolver {
    /** @deprecated */
    private static readonly ACTIVE_FILE_PLACEHOLDER = "%";
    private static readonly ACTIVE_FILE_PLACEHOLDER_NEW = "{{sourceFileName}}";
    private static readonly DATE_PLACEHOLDER = "{{date}}";
    private static readonly HEADING_PLACEHOLDER = "{{heading}}";

    constructor(private readonly workspace: Workspace) {}

    private getActiveFileBaseName() {
        return this.workspace.getActiveFile().basename;
    }

    resolvePlaceholders(text: string, dateFormat: string) {
        return text
            .replace(
                PlaceholderResolver.ACTIVE_FILE_PLACEHOLDER,
                this.getActiveFileBaseName()
            )
            .replace(
                PlaceholderResolver.ACTIVE_FILE_PLACEHOLDER_NEW,
                this.getActiveFileBaseName()
            )
            .replace(
                PlaceholderResolver.DATE_PLACEHOLDER,
                window.moment().format(dateFormat)
            );
    }
}
