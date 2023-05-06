import { Notice } from "obsidian";

import { For, mergeProps } from "solid-js";

import { Accordion } from "./Accordion";
import { ButtonSetting } from "./setting/ButtonSetting";

import { placeholders } from "../../Constants";
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

  const placeholdersWithDesc = () => [
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
  ];

  return (
    <Accordion title="Placeholders you can use">
      <For each={placeholdersWithDesc()}>
        {([placeholder, description]) => (
          <ButtonSetting
            name={placeholder}
            description={description}
            onClick={async () => {
              await window.navigator.clipboard.writeText(placeholder as string);
              // eslint-disable-next-line no-new
              new Notice(`${placeholder} copied to clipboard`);
            }}
            buttonText="Copy to clipboard"
          />
        )}
      </For>
    </Accordion>
  );
}
