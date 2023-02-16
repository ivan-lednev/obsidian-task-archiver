import { Setting, TextAreaComponent } from "obsidian";

import { TryOutComponent } from "./TryOutComponent";

import ObsidianTaskArchiver from "../ObsidianTaskArchiverPlugin";

export class ReplaceTextBeforeArchivingSetting {
    private tryOutComponent: TryOutComponent;

    constructor(
        private readonly containerEl: HTMLDivElement,
        private readonly plugin: ObsidianTaskArchiver
    ) {
        this.display();
    }

    private display() {
        this.containerEl.empty();
        this.containerEl.createEl("h2", { text: "Text replacement" });

        new Setting(this.containerEl)
            .setName("Replace some text before archiving")
            .setDesc(
                "You can use it to remove tags from your archived tasks. Note that this replacement is applied to all the list items in the completed task"
            )
            .addToggle((toggleComponent) => {
                toggleComponent
                    .setValue(this.plugin.settings.textReplacement.applyReplacement)
                    .onChange(async (value) => {
                        this.plugin.settings.textReplacement.applyReplacement = value;
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        if (this.plugin.settings.textReplacement.applyReplacement) {
            new Setting(this.containerEl)
                .setName("Regular expression")
                .addText((component) => {
                    component.setValue(this.plugin.settings.textReplacement.regex);
                    component.onChange(async (value) => {
                        this.plugin.settings.textReplacement.regex = value;
                        await this.plugin.saveSettings();
                        this.displayResult();
                    });
                });

            new Setting(this.containerEl)
                .setName("Replacement")
                .addText((component) => {
                    component.setValue(
                        this.plugin.settings.textReplacement.replacement
                    );
                    component.onChange(async (value) => {
                        this.plugin.settings.textReplacement.replacement = value;
                        await this.plugin.saveSettings();
                        this.displayResult();
                    });
                });

            this.tryOutComponent = new TryOutComponent(
                this.containerEl,
                this.plugin.settings.textReplacement.replacementTest,
                this.getReplacementResult(),
                async (value) => {
                    this.plugin.settings.textReplacement.replacementTest = value;
                    await this.plugin.saveSettings();
                    this.displayResult();
                }
            );
        }
    }

    private displayResult() {
        this.tryOutComponent.displayOutput(this.getReplacementResult());
    }

    private getReplacementResult() {
        const { regex, replacement, replacementTest } =
            this.plugin.settings.textReplacement;
        return replacementTest.replace(new RegExp(regex), replacement);
    }
}
