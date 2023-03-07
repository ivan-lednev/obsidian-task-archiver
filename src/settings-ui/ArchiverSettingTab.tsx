import { App, PluginSettingTab, Setting } from "obsidian";

import { render } from "solid-js/web";

import { ArchiverSettingsPage } from "./components/ArchiverSettingsPage";
import { SettingsProvider } from "./components/context/SettingsProvider";

import ObsidianTaskArchiver from "../ObsidianTaskArchiverPlugin";
import { PlaceholderService } from "../services/PlaceholderService";

export class ArchiverSettingTab extends PluginSettingTab {
  private dispose: () => void;

  constructor(
    app: App,
    private plugin: ObsidianTaskArchiver,
    private placeholderService: PlaceholderService
  ) {
    super(app, plugin);
  }

  display(): void {
    this.containerEl.empty();
    this.dispose?.();

    this.dispose = render(
      () => (
        <SettingsProvider plugin={this.plugin}>
          <ArchiverSettingsPage
            settings={this.plugin.settings}
            plugin={this.plugin}
            placeholderService={this.placeholderService}
          />
        </SettingsProvider>
      ),
      this.containerEl
    );
  }
}
