import {
  JSX,
  createContext,
  createEffect,
  createSignal,
  on,
  useContext,
} from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";

import { Settings } from "../../../Settings";

const SettingsContext = createContext<[Settings, SetStoreFunction<Settings>]>();

interface SettingsProviderProps {
  children: JSX.Element;
  initialSettings: Settings;
  setSettings: (newSettings: Settings) => Promise<void>;
}

export function SettingsProvider(props: SettingsProviderProps) {
  const [settings, setSettingsOriginal] = createStore(props.initialSettings);
  const [triggerUpdate, setTriggerUpdate] = createSignal(1);

  // Solid doesn't notice updates in stores with on(store, ...)
  // See: https://github.com/solidjs/solid/discussions/829
  const setSettings: typeof setSettingsOriginal = (
    ...args: Parameters<typeof setSettingsOriginal>
  ) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setSettingsOriginal(...args);
    setTriggerUpdate(triggerUpdate() + 1);
  };

  createEffect(
    on(triggerUpdate, async () => {
      await props.setSettings(settings);
    })
  );

  return (
    <SettingsContext.Provider value={[settings, setSettings]}>
      {props.children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  return useContext(SettingsContext);
}
