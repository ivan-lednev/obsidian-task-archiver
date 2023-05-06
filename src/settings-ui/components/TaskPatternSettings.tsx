import { Show, createSignal } from "solid-js";

import { useSettingsContext } from "./context/SettingsProvider";
import { SettingGroup } from "./setting/SettingGroup";
import { TextAreaSetting } from "./setting/TextAreaSetting";
import { TextSetting } from "./setting/TextSetting";
import { ToggleSetting } from "./setting/ToggleSetting";

function validatePattern(pattern: string) {
  try {
    new RegExp(pattern);
    return true;
  } catch (e) {
    return false;
  }
}

export function TaskPatternSettings() {
  const [settings, setSettings] = useSettingsContext();

  const [taskPatternInput, setTaskPatternInput] = createSignal(
    settings.additionalTaskPattern
  );
  const [taskPatternTest, setTaskPatternTest] = createSignal("Water the cat #task");

  const getValidationMessage = () => {
    if (!validatePattern(taskPatternInput())) {
      return `🕱 Invalid pattern`;
    }

    if (taskPatternTest().trim().length === 0) {
      return "Empty";
    }

    const match = new RegExp(taskPatternInput()).test(taskPatternTest());
    if (match) {
      return "✔️ Will be archived";
    }

    return "❌ Won't be archived";
  };

  return (
    <SettingGroup>
      <ToggleSetting
        name="Use additional task filter"
        description="Only archive tasks matching this pattern, typically '#task' but can be anything."
        onClick={() => {
          setSettings({ useAdditionalTaskPattern: !settings.useAdditionalTaskPattern });
        }}
        value={settings.useAdditionalTaskPattern}
      />
      <Show when={settings.useAdditionalTaskPattern} keyed>
        <TextSetting
          name="Additional task filter"
          onInput={({ currentTarget: { value } }) => {
            setTaskPatternInput(value);
            if (validatePattern(value)) {
              setSettings({ additionalTaskPattern: value });
            }
          }}
          description={
            validatePattern(taskPatternInput())
              ? "The pattern is valid"
              : `🕱 Invalid pattern`
          }
          value={taskPatternInput()}
        />
        <TextAreaSetting
          name="Try out your task filter"
          description={getValidationMessage()}
          onInput={({ currentTarget: { value } }) => {
            setTaskPatternTest(value);
          }}
          value={taskPatternTest()}
        />
      </Show>
    </SettingGroup>
  );
}
