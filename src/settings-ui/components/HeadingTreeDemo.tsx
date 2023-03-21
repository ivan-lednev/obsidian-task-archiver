import { For } from "solid-js";

import { useSettingsContext } from "./context/SettingsProvider";
import { BaseSetting } from "./setting/BaseSetting";

import { PlaceholderService } from "../../services/PlaceholderService";

interface HeadingTreeDemoProps {
  placeholderService: PlaceholderService;
}

export function HeadingTreeDemo(props: HeadingTreeDemoProps) {
  const [settings] = useSettingsContext();

  return (
    <BaseSetting
      name="Here's what the result looks like:"
      class="archiver-setting-sub-item"
      description={
        <>
          <For each={settings.headings}>
            {(heading, i) => {
              const token = () => "#".repeat(i() + settings.archiveHeadingDepth);
              return (
                <>
                  <code>
                    {token()}{" "}
                    {props.placeholderService.resolve(heading.text, {
                      dateFormat: heading.dateFormat,
                    })}
                  </code>
                  <br />
                </>
              );
            }}
          </For>
          <p>
            <code>- [x] task</code>
          </p>
        </>
      }
    />
  );
}
