import classNames from "classnames";
import { JSX } from "solid-js";

import { BaseSetting } from "./BaseSetting";
import { SettingProps } from "./SettingProps";

export interface ToggleSettingProps extends SettingProps<boolean> {
  onClick: JSX.EventHandler<HTMLInputElement, MouseEvent>;
}

export function ToggleSetting(props: ToggleSettingProps) {
  return (
    <BaseSetting
      name={props.name}
      description={props.description}
      class={classNames("mod-toggle", props.class)}
    >
      <div
        class={classNames("checkbox-container", { "is-enabled": props.value })}
        onClick={props.onClick}
      >
        <input type="checkbox" tabindex="0" />
      </div>
    </BaseSetting>
  );
}
