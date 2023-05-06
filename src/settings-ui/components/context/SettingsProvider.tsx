import { JSX, createContext, createEffect, on, useContext } from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";

import { Settings } from "../../../Settings";

const SettingsContext = createContext<[Settings, SetStoreFunction<Settings>]>();

interface SettingsProviderProps {
  children: JSX.Element;
  initialSettings: Settings;
  setSettings: (newSettings: Settings) => Promise<void>;
}

export function SettingsProvider(props: SettingsProviderProps) {
  const [settings, setSettings] = createStore(props.initialSettings);
  createEffect(
    on(
      () => settings,
      async () => {
        await props.setSettings(settings);
      }
    )
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
