import { Notice } from "obsidian";

import { For, mergeProps } from "solid-js";

import { ButtonSetting } from "./setting/ButtonSetting";
import { SettingGroup } from "./setting/SettingGroup";

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
    <SettingGroup
      header="Placeholders you can use"
      collapsible
      headerIcon={
        <svg // todo: headerIcon
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="svg-icon lucide lucide-clipboard-copy"
        >
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
          <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path>
          <path d="M16 4h2a2 2 0 0 1 2 2v4"></path>
          <path d="M21 14H11"></path>
          <path d="m15 10-4 4 4 4"></path>
        </svg>
      }
    >
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
    </SettingGroup>
  );
}
