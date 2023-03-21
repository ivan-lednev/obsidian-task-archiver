import classNames from "classnames";
import { JSX, createSignal } from "solid-js";

interface AccordionProps {
  children: JSX.Element;
}

export function PlaceholderAccordion(props: AccordionProps) {
  const [active, setActive] = createSignal(false);

  return (
    <>
      <button class="archiver-accordion" onClick={() => setActive(!active())}>
        {active() ? "Hide variables" : "Configure variables"}
      </button>
      <div
        class={classNames("archiver-panel", "archiver-setting-sub-item", {
          "archiver-active": active(),
        })}
      >
        {props.children}
      </div>
    </>
  );
}
