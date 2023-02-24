import { For, JSX } from "solid-js";

import { BaseSetting } from "./BaseSetting";
import { SettingProps } from "./SettingProps";

export interface DropDownSettingProps extends SettingProps<string> {
  onInput: JSX.EventHandler<HTMLSelectElement, InputEvent>;
}

export function DropDownSetting(props: DropDownSettingProps) {
  return (
    <BaseSetting name={props.name} description={props.description} class={props.class}>
      <select class="dropdown" onInput={props.onInput}>
        <For each={["1", "2", "3", "4", "5", "6"]}>
          {(value) => (
            <option value={value} selected={props.value === value}>
              {value}
            </option>
          )}
        </For>
      </select>
    </BaseSetting>
  );
}
