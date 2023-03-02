import { For } from "solid-js";

import { PlaceholderResolver } from "../../features/PlaceholderResolver";

interface PlaceholdersDescriptionProps {
  placeholderResolver: PlaceholderResolver;
}

export function PlaceholdersDescription(props: PlaceholdersDescriptionProps) {
  const defaultFormat = "YYYY-DD-MM";
  const date = props.placeholderResolver.resolvePlaceholders("{{date}}", defaultFormat);
  const sourceFileName = props.placeholderResolver.resolvePlaceholders(
    "{{sourceFileName}}",
    defaultFormat
  );
  const sourceFilePath = props.placeholderResolver.resolvePlaceholders(
    "{{sourceFilePath}}",
    defaultFormat
  );

  return (
    <>
      Special values are available here:
      <ul>
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
          ]}
        >
          {([placeholder, description]) => (
            <li>
              <code>{placeholder}</code> - {description}
            </li>
          )}
        </For>
      </ul>
    </>
  );
}
