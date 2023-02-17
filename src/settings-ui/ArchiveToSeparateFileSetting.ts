import { Setting } from "obsidian";

import ObsidianTaskArchiver from "../ObsidianTaskArchiverPlugin";

export class ArchiveToSeparateFileSetting {
    constructor(
        private readonly containerEl: HTMLDivElement,
        private readonly plugin: ObsidianTaskArchiver
    ) {
        this.display();
    }

    private display() {
        this.containerEl.empty();
        this.containerEl.createEl("h2", { text: "Archive file settings" });

        new Setting(this.containerEl)
            .setName("Archive to a separate file")
            .setDesc(
                "If checked, the archiver will search for a file based on the pattern and will try to create it if needed"
            )
            .addToggle((toggleComponent) => {
                toggleComponent
                    .setValue(this.plugin.settings.archiveToSeparateFile)
                    .onChange(async (value) => {
                        this.plugin.settings.archiveToSeparateFile = value;
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        if (this.plugin.settings.archiveToSeparateFile) {
            new Setting(this.containerEl)
                .setName("Archive file name")
                .setDesc(
                    createFragment((fragment) => {
                        fragment.appendText("Special values are available here:");
                        fragment.appendChild(
                            createEl("ul", {}, (ul) => {
                                ul.appendChild(
                                    createEl("li", {}, (li) =>
                                        li.append(
                                            createEl("b", { text: "{{date}}" }),
                                            " resolves to the date in the format specified above. You can use this to archive tasks to daily notes"
                                        )
                                    )
                                );
                                ul.appendChild(
                                    createEl("li", {}, (li) =>
                                        li.append(
                                            createEl("b", {
                                                text: "{{sourceFileName}}",
                                            }),
                                            " points to the active file name"
                                        )
                                    )
                                );
                            })
                        );
                    })
                )
                .addText((textComponent) => {
                    textComponent
                        .setValue(this.plugin.settings.defaultArchiveFileName)
                        .onChange(async (value) => {
                            this.plugin.settings.defaultArchiveFileName = value;
                            await this.plugin.saveSettings();
                        });
                });

            new Setting(this.containerEl).setName("{{date}} format").then((setting) => {
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
                        .setDefaultFormat(this.plugin.settings.dateFormat)
                        .setPlaceholder(this.plugin.settings.dateFormat)
                        .setValue(this.plugin.settings.dateFormat)
                        .onChange(async (value) => {
                            this.plugin.settings.dateFormat = value;
                            await this.plugin.saveSettings();
                        });
                });
            });
        }
    }
}
