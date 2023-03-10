import { Accessor, For } from "solid-js";

import { DateFormatDescription } from "./DateFormatDescription";
import { PlaceholdersDescription } from "./PlaceholdersDescription";
import { useSettingsContext } from "./context/SettingsProvider";
import { BaseSetting } from "./setting/BaseSetting";
import { TextAreaSetting } from "./setting/TextAreaSetting";
import { TextSetting } from "./setting/TextSetting";

import { Rule as RuleType } from "../../Settings";
import { PlaceholderService } from "../../services/PlaceholderService";

interface RuleProps {
  placeholderResolver: PlaceholderService;
  index: Accessor<number>;
}

function dedupe(value: string) {
  return [...new Set(value.split(""))].join("");
}

export function Rule(props: RuleProps) {
  const [settings, setSettings] = useSettingsContext();
  const ruleSettings = () => settings.rules[props.index()];
  const dateFormat = () => ruleSettings().dateFormat;
  const archivePath = () => ruleSettings().defaultArchiveFileName;
  const dedupedStatuses = () => dedupe(ruleSettings().statuses);

  const updateRule = (newValues: Partial<RuleType>) =>
    setSettings("rules", (rule, i) => i === props.index(), newValues);
  const deleteRule = () =>
    setSettings("rules", (prev) => prev.filter((rule, i) => i !== props.index()));

  const renderStatusExamples = () => (
    <>
      These tasks will be matched:
      <ul class="archiver-status-examples">
        <For each={dedupedStatuses().split("")}>
          {(status) => (
            <li>
              <code>- [{status}] task</code>
            </li>
          )}
        </For>
      </ul>
    </>
  );

  return (
    <div class="archiver-rule-container">
      <h2>When</h2>

      <TextSetting
        onInput={(event) => {
          const dedupedValue = dedupe(event.currentTarget.value);

          if (dedupedValue === dedupedStatuses()) {
            event.currentTarget.value = dedupedValue;
          } else {
            updateRule({ statuses: dedupedValue });
          }
        }}
        name={"A task has one of statuses"}
        description={
          dedupedStatuses().length === 0
            ? "Add some statuses, like '>', '-', '?'"
            : renderStatusExamples()
        }
        placeholder={"-?>"}
        value={dedupedStatuses()}
      />

      <h2>Then</h2>

      <BaseSetting name="Move it to another file" />
      <TextAreaSetting
        onInput={({ currentTarget: { value } }) =>
          updateRule({ defaultArchiveFileName: value })
        }
        name="File name"
        description={
          <PlaceholdersDescription placeholderResolver={props.placeholderResolver} />
        }
        value={archivePath()}
        class="archiver-setting-sub-item"
      />
      <TextSetting
        onInput={({ currentTarget: { value } }) => updateRule({ dateFormat: value })}
        name="Date format"
        description={<DateFormatDescription dateFormat={dateFormat()} />}
        value={dateFormat()}
        class="archiver-setting-sub-item"
      />
      <BaseSetting>
        <button onClick={deleteRule}>Delete rule</button>
      </BaseSetting>
    </div>
  );
}
