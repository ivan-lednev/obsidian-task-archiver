import { For, mergeProps } from "solid-js";

import { DEFAULT_DATE_FORMAT } from "../../Constants";
import { DEFAULT_SETTINGS } from "../../Settings";
import { PlaceholderService } from "../../services/PlaceholderService";

interface PlaceholdersDescriptionProps {
  placeholderResolver: PlaceholderService;
  extraPlaceholders?: [string, string][];
}

export function PlaceholdersDescription(props: PlaceholdersDescriptionProps) {
  const mergedProps = mergeProps({ extraPlaceholders: [] }, props);
  const sourceFileName = mergedProps.placeholderResolver.resolve(
    "{{sourceFileName}}",
    DEFAULT_DATE_FORMAT
  );
  const sourceFilePath = mergedProps.placeholderResolver.resolve(
    "{{sourceFilePath}}",
    DEFAULT_DATE_FORMAT
  );

  return (
    <>
      Placeholders you can use:
      <table>
        <For
          each={[
            ["{{date}}", "resolves to the current date in any format"],
            [
              "{{sourceFileName}}",
              <>
                for the currently open file it resolves to <b>{sourceFileName}</b>
              </>,
            ],
            [
              "{{sourceFilePath}}",
              <>
                for the currently open file it resolves to <b>{sourceFilePath}</b>
              </>,
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
