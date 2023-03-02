import { For, mergeProps } from "solid-js";

import { PlaceholderResolver } from "../../features/PlaceholderResolver";

interface PlaceholdersDescriptionProps {
  placeholderResolver: PlaceholderResolver;
  extraPlaceholders?: [string, string][];
}

export function PlaceholdersDescription(props: PlaceholdersDescriptionProps) {
  const mergedProps = mergeProps({ extraPlaceholders: [] }, props);
  const defaultFormat = "YYYY-DD-MM";
  const sourceFileName = mergedProps.placeholderResolver.resolvePlaceholders(
    "{{sourceFileName}}",
    defaultFormat
  );
  const sourceFilePath = mergedProps.placeholderResolver.resolvePlaceholders(
    "{{sourceFilePath}}",
    defaultFormat
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
