import classNames from "classnames";
import { JSX, Show } from "solid-js";

import { BaseSetting } from "./BaseSetting";
import { SettingProps } from "./SettingProps";

export interface ToggleSettingProps extends SettingProps<boolean> {
  onClick: JSX.EventHandler<HTMLDivElement, MouseEvent>;
  children?: JSX.Element;
}

export function ToggleSetting(props: ToggleSettingProps) {
  return (
    <>
      <BaseSetting
        name={props.name}
        description={props.description}
        class={classNames("mod-toggle", props.class)}
      >
        <div
          class={classNames("checkbox-container", { "is-enabled": props.value })}
          onClick={(e) => props.onClick(e)}
        >
          <input type="checkbox" tabindex="0" />
        </div>
      </BaseSetting>
      {/* todo: delete */}
      <Show when={props.children && props.value} keyed>
        <div class="archiver-setting-sub-item">{props.children}</div>
      </Show>
    </>
  );
}
