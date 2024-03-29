import classNames from "classnames";
import { JSX } from "solid-js";

import { BaseSetting } from "./BaseSetting";
import { SettingProps } from "./SettingProps";

interface TextSettingProps extends SettingProps<string> {
  onInput: JSX.EventHandler<HTMLInputElement, InputEvent>;
  placeholder?: string;
}

export function TextSetting(props: TextSettingProps) {
  return (
    <BaseSetting
      name={props.name}
      description={props.description}
      class={classNames("mod-text", props.class)}
    >
      <input
        type="text"
        spellcheck={false}
        value={props.value}
        onInput={(e) => props.onInput(e)}
        placeholder={props.placeholder}
      />
    </BaseSetting>
  );
}
