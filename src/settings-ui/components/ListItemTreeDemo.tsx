import { For } from "solid-js";

import { useSettingsContext } from "./context/SettingsProvider";
import { BaseSetting } from "./setting/BaseSetting";

import { NON_BREAKING_SPACE } from "../../Constants";
import { PlaceholderService } from "../../services/PlaceholderService";

interface ListItemTreeDemoProps {
  placeholderService: PlaceholderService;
}

export function ListItemTreeDemo(props: ListItemTreeDemoProps) {
  const [settings] = useSettingsContext();

  return (
    <BaseSetting
      name="Here's what the result looks like:"
      class="archiver-setting-sub-item"
      description={
        <For each={[...settings.listItems, { text: "[x] task" }]}>
          {(listItem, i) => {
            const indentationWithToken = () =>
              `${NON_BREAKING_SPACE.repeat(i() * 2)}- `;

            return (
              <>
                <code>
                  {indentationWithToken()}
                  {props.placeholderService.resolve(listItem.text, {
                    dateFormat: listItem.dateFormat,
                  })}
                </code>
                <br />
              </>
            );
          }}
        </For>
      }
    />
  );
}
