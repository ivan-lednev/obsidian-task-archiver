import { Accessor } from "solid-js";

import { Accordion } from "./Accordion";
import { DateFormatDescription } from "./DateFormatDescription";
import { useSettingsContext } from "./context/SettingsProvider";
import { BaseSetting } from "./setting/BaseSetting";
import { TextSetting } from "./setting/TextSetting";

import { DEFAULT_DATE_FORMAT } from "../../Constants";
import { TreeLevelConfig } from "../../Settings";

interface HeadingsSettingsProps {
  heading: TreeLevelConfig;
  index: number;
}

export function HeadingsSettings(props: HeadingsSettingsProps) {
  const [, setSettings] = useSettingsContext();

  // indeed, we need this to be a signal!
  const headingLevel = () => props.index + 1;
  return (
    <>
      <BaseSetting
        name={`Heading text (level ${headingLevel()})`}
        class="archiver-setting-sub-item"
      >
        <input
          type="text"
          value={props.heading.text}
          onInput={({ currentTarget: { value } }) =>
            setSettings("headings", props.index, { text: value })
          }
        />
        <button
          onClick={() =>
            setSettings("headings", (prev) => prev.filter((h, i) => i !== props.index))
          }
        >
          Delete
        </button>
      </BaseSetting>
      <Accordion>
        <TextSetting
          onInput={({ currentTarget: { value } }) => {
            setSettings("headings", props.index, { dateFormat: value });
          }}
          name={`Date format (level ${headingLevel()})`}
          placeholder={DEFAULT_DATE_FORMAT}
          description={
            <DateFormatDescription
              dateFormat={props.heading.dateFormat || DEFAULT_DATE_FORMAT}
            />
          }
          value={props.heading.dateFormat || DEFAULT_DATE_FORMAT}
          class="archiver-setting-sub-item"
        />
        <TextSetting
          onInput={({ currentTarget: { value } }) => {
            setSettings("headings", props.index, {
              obsidianTasksCompletedDateFormat: value,
            });
          }}
          name={`obsidian-tasks completed date format (level ${headingLevel()})`}
          placeholder={DEFAULT_DATE_FORMAT}
          description={
            <DateFormatDescription
              dateFormat={
                props.heading.obsidianTasksCompletedDateFormat || DEFAULT_DATE_FORMAT
              }
            />
          }
          value={props.heading.obsidianTasksCompletedDateFormat || DEFAULT_DATE_FORMAT}
          class="archiver-setting-sub-item"
        />
      </Accordion>
    </>
  );
}
