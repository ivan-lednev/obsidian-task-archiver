import { App, PluginSettingTab, Setting } from "obsidian";

import { render } from "solid-js/web";

import { ArchiverSettingsPage } from "./components/ArchiverSettingsPage";
import { SettingsProvider } from "./components/context/SettingsProvider";

import ObsidianTaskArchiver from "../ObsidianTaskArchiverPlugin";
import { PlaceholderResolver } from "../features/PlaceholderResolver";

export class ArchiverSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: ObsidianTaskArchiver,
    private placeholderResolver: PlaceholderResolver
  ) {
    super(app, plugin);
  }

  display(): void {
    this.containerEl.empty();
    render(
      () => (
        <SettingsProvider plugin={this.plugin}>
          <ArchiverSettingsPage
            settings={this.plugin.settings}
            plugin={this.plugin}
            placeholderResolver={this.placeholderResolver}
          />
        </SettingsProvider>
      ),
      this.containerEl
    );
  }
}
