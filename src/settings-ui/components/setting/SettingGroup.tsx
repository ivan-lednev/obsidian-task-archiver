import { JSX, Show, createSignal } from "solid-js";

interface SettingGroupProps {
  children: JSX.Element;
  header?: string | JSX.Element;
  headerIcon?: string | JSX.Element;
  collapsible?: boolean;
  initialFolded?: boolean;
}

export function SettingGroup(props: SettingGroupProps) {
  const [folded, setFolded] = createSignal(props.initialFolded ?? true);

  return (
    <div class="archiver-setting-group">
      <Show when={props.header} keyed>
        <button type="button" class="header" onClick={() => setFolded(!folded())}>
          <Show when={props.headerIcon} keyed>
            {props.headerIcon}
          </Show>
          <div>{props.header}</div>
          <Show when={props.collapsible} keyed>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="svg-icon lucide-chevron-right"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Show>
        </button>
      </Show>
      <Show when={!props.collapsible || !folded()} keyed>
        <div class="archiver-setting-group-content">{props.children}</div>
      </Show>
    </div>
  );
}
