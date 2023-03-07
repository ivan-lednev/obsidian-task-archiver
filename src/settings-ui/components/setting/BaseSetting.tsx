import classNames from "classnames";
import { JSX } from "solid-js";

interface BaseSettingProps {
  name?: string | JSX.Element;
  description?: string | JSX.Element;
  children?: JSX.Element;
  class?: string;
}

export function BaseSetting(props: BaseSettingProps) {
  return (
    <div class={classNames("setting-item", props.class)}>
      <div class="setting-item-info">
        <div class="setting-item-name">{props.name}</div>
        <div class="setting-item-description">{props.description}</div>
      </div>
      <div class="setting-item-control">{props.children}</div>
    </div>
  );
}
