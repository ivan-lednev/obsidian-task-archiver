import { IndentationSettings } from "./archiver/IndentationSettings";

export function buildIndentation(settings: IndentationSettings) {
    return settings.useTab ? "\t" : " ".repeat(settings.tabSize);
}
