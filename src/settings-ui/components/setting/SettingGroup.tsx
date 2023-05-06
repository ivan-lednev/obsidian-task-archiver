import { JSX } from "solid-js";

export function SettingGroup(props: { children: JSX.Element }) {
  return <div class="archiver-setting-group">{props.children}</div>;
}
