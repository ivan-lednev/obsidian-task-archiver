import { JSX } from "solid-js";

export interface SettingProps<T> {
  name: string | JSX.Element;
  description?: string | JSX.Element;
  value: T;
  class?: string;
}
