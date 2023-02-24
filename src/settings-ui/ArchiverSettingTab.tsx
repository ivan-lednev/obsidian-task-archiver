import { App, PluginSettingTab, Setting } from "obsidian";

import { render } from "solid-js/web";

import { ArchiverSettings } from "./components/ArchiverSettings";

import ObsidianTaskArchiver from "../ObsidianTaskArchiverPlugin";

export class ArchiverSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: ObsidianTaskArchiver) {
    super(app, plugin);
  }

  display(): void {
    this.containerEl.empty();
    render(
      () => <ArchiverSettings settings={this.plugin.settings} plugin={this.plugin} />,
      this.containerEl
    );
  }
}
