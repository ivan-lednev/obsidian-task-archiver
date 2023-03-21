import { JSX } from "solid-js";

import { BaseSetting } from "./BaseSetting";
import { SettingProps } from "./SettingProps";

interface ButtonSettingProps extends SettingProps<boolean> {
  onClick: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
  buttonText: string;
}

export function ButtonSetting(props: ButtonSettingProps) {
  return (
    <BaseSetting name={props.name} description={props.description} class={props.class}>
      <button onClick={(e) => props.onClick(e)}>{props.buttonText}</button>
    </BaseSetting>
  );
}
