import { noop } from "lodash";
import { Accessor, JSX } from "solid-js";

import { DateFormatDescription } from "./DateFormatDescription";
import { PlaceholdersDescription } from "./PlaceholdersDescription";
import { useSettingsContext } from "./context/SettingsProvider";
import { BaseSetting } from "./setting/BaseSetting";
import { TextAreaSetting } from "./setting/TextAreaSetting";
import { TextSetting } from "./setting/TextSetting";

import { PlaceholderResolver } from "../../features/PlaceholderResolver";

interface RuleProps {
  placeholderResolver: PlaceholderResolver;
  statuses: string;
  archivePath: string;
  index: Accessor<number>;
}

export function Rule(props: RuleProps) {
  const [, setSettings] = useSettingsContext();

  return (
    <div class="archiver-rule-container">
      <h2>When</h2>

      <TextSetting
        onInput={({ currentTarget: { value } }) =>
          setSettings(
            "rules",
            (rule, i) => i === props.index(),
            (prev) => ({
              ...prev,
              statuses: value,
            })
          )
        }
        name={"A task has one of statuses"}
        value={props.statuses}
      />

      <h2>Then</h2>

      <BaseSetting name="Move it to another file" />
      <TextAreaSetting
        onInput={({ currentTarget: { value } }) =>
          setSettings(
            "rules",
            (rule, i) => i === props.index(),
            (prev) => ({
              ...prev,
              defaultArchiveFileName: value,
            })
          )
        }
        name="File name"
        description={
          <PlaceholdersDescription placeholderResolver={props.placeholderResolver} />
        }
        value={props.archivePath}
        class="archiver-setting-sub-item"
      />
      <TextSetting
        onInput={noop}
        name={
          <>
            <code>{"{{date}}"}</code> format
          </>
        }
        description={<DateFormatDescription dateFormat={"TODO"} />}
        value={"TODO"}
        class="archiver-setting-sub-item"
      />
      <BaseSetting name={""}>
        <button
          onClick={() =>
            setSettings("rules", (prev) =>
              prev.filter((rule, i) => i !== props.index())
            )
          }
        >
          Delete rule
        </button>
      </BaseSetting>
    </div>
  );
}
