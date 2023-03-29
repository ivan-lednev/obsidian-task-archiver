import { For, mergeProps } from "solid-js";

import { DEFAULT_DATE_FORMAT, placeholders } from "../../Constants";
import { DEFAULT_SETTINGS } from "../../Settings";
import { PlaceholderService } from "../../services/PlaceholderService";

interface PlaceholdersDescriptionProps {
  placeholderResolver: PlaceholderService;
  extraPlaceholders?: [string, string][];
}

export function PlaceholdersDescription(props: PlaceholdersDescriptionProps) {
  const mergedProps = mergeProps({ extraPlaceholders: [] }, props);
  const sourceFileName = () =>
    mergedProps.placeholderResolver.resolve(placeholders.ACTIVE_FILE_NEW);
  const sourceFilePath = () =>
    mergedProps.placeholderResolver.resolve(placeholders.ACTIVE_FILE_PATH);

  return (
    <>
      Placeholders you can use:
      <table>
        <For
          each={[
            [placeholders.DATE, "resolves to the current date in any format"],
            [
              placeholders.ACTIVE_FILE_NEW,
              <>
                for the currently open file it resolves to <b>{sourceFileName()}</b>
              </>,
            ],
            [
              placeholders.ACTIVE_FILE_PATH,
              <>
                for the currently open file it resolves to <b>{sourceFilePath()}</b>
              </>,
            ],
            [
              placeholders.OBSIDIAN_TASKS_COMPLETED_DATE,
              "obsidian-tasks completed date (✅ 2023-03-20); if the task doesn't have one, defaults to today",
            ],
            ...mergedProps.extraPlaceholders,
          ]}
        >
          {([placeholder, description]) => (
            <tr>
              <td class="archiver-placeholders-description">
                <code>{placeholder}</code>
              </td>
              <td>{description}</td>
            </tr>
          )}
        </For>
      </table>
    </>
  );
}
