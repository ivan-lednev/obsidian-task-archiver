import { Workspace } from "obsidian";

export class PlaceholderResolver {
    /** @deprecated */
    private static readonly ACTIVE_FILE_PLACEHOLDER = "%";
    private static readonly ACTIVE_FILE_PLACEHOLDER_NEW = "{{sourceFileName}}";
    private static readonly ACTIVE_FILE_PATH_PLACEHOLDER = "{{sourceFilePath}}";
    private static readonly DATE_PLACEHOLDER = "{{date}}";
    private static readonly HEADING_PLACEHOLDER = "{{heading}}";

    constructor(private readonly workspace: Workspace) {}

    private getActiveFile() {
        return this.workspace.getActiveFile();
    }

    private getActiveFilePathWithoutExtension() {
        const extensionPattern = /\.\w+$/;
        return (
            this.getActiveFile()?.path?.replace(extensionPattern, "") || "No file open"
        );
    }

    resolve(text: string, dateFormat: string, heading?: string) {
        return text
            .replace(
                PlaceholderResolver.ACTIVE_FILE_PLACEHOLDER,
                this.getActiveFile()?.basename || "No file open"
            )
            .replace(
                PlaceholderResolver.ACTIVE_FILE_PLACEHOLDER_NEW,
                this.getActiveFile()?.basename || "No file open"
            )
            .replace(
                PlaceholderResolver.ACTIVE_FILE_PATH_PLACEHOLDER,
                this.getActiveFilePathWithoutExtension()
            )
            .replace(
                PlaceholderResolver.HEADING_PLACEHOLDER,
                heading?.trim() || this.getActiveFile()?.basename || "No file open"
            )
            .replace(
                PlaceholderResolver.DATE_PLACEHOLDER,
                window.moment().format(dateFormat)
            );
    }
}
