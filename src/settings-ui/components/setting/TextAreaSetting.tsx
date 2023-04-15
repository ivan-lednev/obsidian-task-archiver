import classNames from "classnames";
import { JSX, createSignal } from "solid-js";

import { BaseSetting } from "./BaseSetting";
import { SettingProps } from "./SettingProps";

interface TextAreaSettingProps extends SettingProps<string> {
  onInput: JSX.EventHandler<HTMLTextAreaElement, InputEvent>;
  placeholder?: string;
  inputClass?: string;
}

export function TextAreaSetting(props: TextAreaSettingProps) {
  return (
    <BaseSetting
      name={props.name}
      description={props.description}
      class={classNames("mod-text", props.class)}
    >
      <textarea
        spellcheck={false}
        value={props.value}
        onInput={props.onInput}
        placeholder={props.placeholder}
        class={props.inputClass}
      />
    </BaseSetting>
  );
}
