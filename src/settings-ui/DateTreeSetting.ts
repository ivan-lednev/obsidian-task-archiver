import { Setting } from "obsidian";

import ObsidianTaskArchiver from "../ObsidianTaskArchiverPlugin";

export class DateTreeSetting {
    constructor(
        private readonly containerEl: HTMLDivElement,
        private readonly plugin: ObsidianTaskArchiver
    ) {
        this.display();
    }

    private display() {
        this.containerEl.empty();
        this.containerEl.createEl("h2", { text: "Date levels settings" });

        new Setting(this.containerEl)
            .setName("Use weeks")
            .setDesc("Add completed tasks under a link to the current week")
            .addToggle((toggleComponent) =>
                toggleComponent
                    .setValue(this.plugin.settings.useWeeks)
                    .onChange(async (value) => {
                        this.plugin.settings.useWeeks = value;
                        await this.plugin.saveSettings();
                        this.display();
                    })
            );

        if (this.plugin.settings.useWeeks) {
            new Setting(this.containerEl)
                .setDisabled(!this.plugin.settings.useWeeks)
                .setName("Weekly note pattern")
                .then((setting) => {
                    setting.addMomentFormat((momentFormat) => {
                        setting.descEl.appendChild(
                            createFragment((fragment) => {
                                fragment.appendText("For more syntax, refer to ");
                                fragment.createEl(
                                    "a",
                                    {
                                        text: "format reference",
                                        href: "https://momentjs.com/docs/#/displaying/format/",
                                    },
                                    (a) => {
                                        a.setAttr("target", "_blank");
                                    }
                                );
                                fragment.createEl("br");
                                fragment.appendText(
                                    "Your current syntax looks like this: "
                                );
                                momentFormat.setSampleEl(fragment.createEl("b"));
                                fragment.createEl("br");
                            })
                        );

                        momentFormat
                            .setDefaultFormat(this.plugin.settings.weeklyNoteFormat)
                            .setPlaceholder(this.plugin.settings.weeklyNoteFormat)
                            .setValue(this.plugin.settings.weeklyNoteFormat)
                            .onChange(async (value) => {
                                this.plugin.settings.weeklyNoteFormat = value;
                                await this.plugin.saveSettings();
                            });
                    });
                });
        }

        new Setting(this.containerEl)
            .setName("Use days")
            .setDesc("Add completed tasks under a link to the current day")
            .addToggle((toggleComponent) =>
                toggleComponent
                    .setValue(this.plugin.settings.useDays)
                    .onChange(async (value) => {
                        this.plugin.settings.useDays = value;
                        await this.plugin.saveSettings();
                        this.display();
                    })
            );

        if (this.plugin.settings.useDays) {
            new Setting(this.containerEl)
                .setDisabled(!this.plugin.settings.useDays)
                .setName("Daily note pattern")
                .then((setting) => {
                    setting.addMomentFormat((momentFormat) => {
                        setting.descEl.appendChild(
                            createFragment((fragment) => {
                                fragment.appendText("For more syntax, refer to ");
                                fragment.createEl(
                                    "a",
                                    {
                                        text: "format reference",
                                        href: "https://momentjs.com/docs/#/displaying/format/",
                                    },
                                    (a) => {
                                        a.setAttr("target", "_blank");
                                    }
                                );
                                fragment.createEl("br");
                                fragment.appendText(
                                    "Your current syntax looks like this: "
                                );
                                momentFormat.setSampleEl(fragment.createEl("b"));
                                fragment.createEl("br");
                            })
                        );

                        momentFormat
                            .setDefaultFormat(this.plugin.settings.dailyNoteFormat)
                            .setPlaceholder(this.plugin.settings.dailyNoteFormat)
                            .setValue(this.plugin.settings.dailyNoteFormat)
                            .onChange(async (value) => {
                                this.plugin.settings.dailyNoteFormat = value;
                                await this.plugin.saveSettings();
                            });
                    });
                });
        }
    }
}
