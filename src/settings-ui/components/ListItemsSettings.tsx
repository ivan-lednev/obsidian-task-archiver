import { DateFormatDescription } from "./DateFormatDescription";
import { useSettingsContext } from "./context/SettingsProvider";
import { BaseSetting } from "./setting/BaseSetting";
import { TextSetting } from "./setting/TextSetting";

import { DEFAULT_DATE_FORMAT } from "../../Constants";
import { TreeLevelConfig } from "../../Settings";

interface HeadingsSettingsProps {
  listItem: TreeLevelConfig;
  index: number;
}

export function ListItemsSettings(props: HeadingsSettingsProps) {
  const [, setSettings] = useSettingsContext();

  const listItemLevel = () => props.index + 1;
  return (
    <>
      <BaseSetting name={`List item text (level ${listItemLevel()})`}>
        <input
          type="text"
          value={props.listItem.text}
          onInput={({ currentTarget: { value } }) =>
            setSettings("listItems", props.index, { text: value })
          }
        />
        <button
          onClick={() =>
            setSettings("listItems", (prev) => prev.filter((h, i) => i !== props.index))
          }
        >
          Delete
        </button>
      </BaseSetting>
      <TextSetting
        onInput={({ currentTarget: { value } }) => {
          setSettings("listItems", props.index, { dateFormat: value });
        }}
        name={`Date format (level ${listItemLevel()})`}
        placeholder={DEFAULT_DATE_FORMAT}
        description={
          <DateFormatDescription
            dateFormat={props.listItem.dateFormat || DEFAULT_DATE_FORMAT}
          />
        }
        value={props.listItem.dateFormat || DEFAULT_DATE_FORMAT}
      />
    </>
  );
}
