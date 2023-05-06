import { JSX, Show, createSignal } from "solid-js";

export interface AccordionProps {
  title?: string;
  children?: JSX.Element;
}

// todo: clean up once esbuild is used
export function Accordion(props: AccordionProps) {
  const [folded, setFolded] = createSignal(true);

  return (
    <div class="callout is-collapsible archiver-accordion">
      <div class="callout-title" onClick={() => setFolded(!folded())}>
        <div class="callout-title-inner">{props.title}</div>
        <div class="callout-fold">
          {folded() ? (
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
          ) : (
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
              class="svg-icon lucide-chevron-down"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
      </div>
      <Show when={!folded()} keyed>
        <div class="callout-content">{props.children}</div>
      </Show>
    </div>
  );
}
