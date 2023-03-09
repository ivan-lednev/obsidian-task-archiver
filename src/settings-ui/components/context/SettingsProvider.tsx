import { JSX, createContext, createEffect, useContext } from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";

import ObsidianTaskArchiver from "../../../ObsidianTaskArchiverPlugin";
import { Settings } from "../../../Settings";

const SettingsContext = createContext<[Settings, SetStoreFunction<Settings>]>();

interface SettingsProviderProps {
  children: JSX.Element;
  plugin: ObsidianTaskArchiver;
}

export function SettingsProvider(props: SettingsProviderProps) {
  const [settings, setSettings] = createStore(props.plugin.settings);
  createEffect(async () => {
    // todo: do we need unwrapping?
    // plugin.settings = unwrap(settings);
    await props.plugin.saveSettings(settings);
  });

  return (
    <SettingsContext.Provider value={[settings, setSettings]}>
      {props.children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  return useContext(SettingsContext);
}
