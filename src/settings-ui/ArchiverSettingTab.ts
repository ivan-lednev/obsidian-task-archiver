import { App, PluginSettingTab, Setting } from "obsidian";

import { AdditionalTaskFilter } from "./AdditionalTaskFilter";
import { ArchiveToSeparateFileSetting } from "./ArchiveToSeparateFileSetting";
import { DateTreeSetting } from "./DateTreeSetting";
import { ReplaceTextBeforeArchivingSetting } from "./ReplaceTextBeforeArchivingSetting";
import { TryOutComponent } from "./TryOutComponent";

import ObsidianTaskArchiver from "../ObsidianTaskArchiverPlugin";

export class ArchiverSettingTab extends PluginSettingTab {
    constructor(app: App, private plugin: ObsidianTaskArchiver) {
        super(app, plugin);
    }

    display(): void {
        this.containerEl.empty();
        this.containerEl.createEl("h1", { text: "Archiver settings" });

        new Setting(this.containerEl)
            .setName("Archive all checked tasks")
            .setDesc(
                "Archive tasks with symbols other than 'x' (like '[>]', '[-]', etc.)"
            )
            .addToggle((toggleComponent) => {
                toggleComponent
                    .setValue(this.plugin.settings.archiveAllCheckedTaskTypes)
                    .onChange(async (value) => {
                        this.plugin.settings.archiveAllCheckedTaskTypes = value;
                        await this.plugin.saveSettings();
                    });
            });

        new AdditionalTaskFilter(this.containerEl.createDiv(), this.plugin);

        // this.containerEl.createEl("h2", {
        //     text: "Adding text/metadata to top-level completed tasks",
        // });
        //
        // new Setting(this.containerEl)
        //     .setName("Enable adding text/metadata")
        //     .addToggle((toggleComponent) => {
        //         toggleComponent
        //             .setValue(
        //                 this.plugin.settings.additionalMetadataBeforeArchiving
        //                     .addMetadata
        //             )
        //             .onChange(async (value) => {
        //                 this.plugin.settings.additionalMetadataBeforeArchiving.addMetadata =
        //                     value;
        //                 await this.plugin.saveSettings();
        //                 this.display();
        //             });
        //     });
        //
        // if (this.plugin.settings.additionalMetadataBeforeArchiving.addMetadata) {
        //     new Setting(this.containerEl).setName("{{date}} format").then((setting) => {
        //         setting.addMomentFormat((momentFormat) => {
        //             setting.descEl.appendChild(
        //                 createFragment((fragment) => {
        //                     fragment.appendText("For more syntax, refer to ");
        //                     fragment.createEl(
        //                         "a",
        //                         {
        //                             text: "format reference",
        //                             href: "https://momentjs.com/docs/#/displaying/format/",
        //                         },
        //                         (a) => {
        //                             a.setAttr("target", "_blank");
        //                         }
        //                     );
        //                     fragment.createEl("br");
        //                     fragment.appendText(
        //                         "Your current syntax looks like this: "
        //                     );
        //                     momentFormat.setSampleEl(fragment.createEl("b"));
        //                     fragment.createEl("br");
        //                 })
        //             );
        //
        //             // todo: bug, copypaste
        //             momentFormat
        //                 .setDefaultFormat(
        //                     this.plugin.settings.additionalMetadataBeforeArchiving
        //                         .dateFormat
        //                 )
        //                 .setPlaceholder(
        //                     this.plugin.settings.additionalMetadataBeforeArchiving
        //                         .dateFormat
        //                 )
        //                 .setValue(
        //                     this.plugin.settings.additionalMetadataBeforeArchiving
        //                         .dateFormat
        //                 )
        //                 .onChange(async (value) => {
        //                     this.plugin.settings.additionalMetadataBeforeArchiving.dateFormat =
        //                         value;
        //                     await this.plugin.saveSettings();
        //                 });
        //         });
        //     });
        //
        //     new Setting(this.containerEl)
        //         .setName("The metadata you want to append")
        //         .setDesc(
        //             createFragment((fragment) => {
        //                 fragment.appendText("Special values are available here:");
        //                 fragment.createEl("ul", {}, (ul) => {
        //                     ul.createEl("li", {}, (li) =>
        //                         li.append(
        //                             createEl("b", { text: "{{date}}" }),
        //                             " resolves to the date in the format specified above. You can use this to archive tasks to daily notes"
        //                         )
        //                     );
        //                     ul.createEl("li", {}, (li) =>
        //                         li.append(
        //                             createEl("b", {
        //                                 text: "{{sourceFileName}}",
        //                             }),
        //                             " points to the active file name"
        //                         )
        //                     );
        //                 });
        //             })
        //         )
        //         .addText((textComponent) => {
        //             textComponent
        //                 .setPlaceholder("metadata or text")
        //                 .setValue(
        //                     this.plugin.settings.additionalMetadataBeforeArchiving
        //                         .metadata
        //                 )
        //                 .onChange(async (value) => {
        //                     this.plugin.settings.additionalMetadataBeforeArchiving.metadata =
        //                         value;
        //                     await this.plugin.saveSettings();
        //                 });
        //         });
        // }

        new ReplaceTextBeforeArchivingSetting(
            this.containerEl.createDiv(),
            this.plugin
        );
        new ArchiveToSeparateFileSetting(this.containerEl.createDiv(), this.plugin);

        this.containerEl.createEl("h2", { text: "Archive heading settings" });

        new Setting(this.containerEl)
            .setName("Archive heading text")
            .setDesc("A heading with this text will be used as an archive")
            .addText((textComponent) => {
                textComponent
                    .setPlaceholder(this.plugin.settings.archiveHeading)
                    .setValue(this.plugin.settings.archiveHeading)
                    .onChange(async (value) => {
                        this.plugin.settings.archiveHeading = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(this.containerEl)
            .setName("Add newlines around the archive heading")
            .addToggle((toggleComponent) => {
                toggleComponent
                    .setValue(this.plugin.settings.addNewlinesAroundHeadings)
                    .onChange(async (value) => {
                        this.plugin.settings.addNewlinesAroundHeadings = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(this.containerEl)
            .setName("Depth of new archive headings")
            .addDropdown((dropdownComponent) => {
                dropdownComponent
                    .addOptions({
                        "1": "1",
                        "2": "2",
                        "3": "3",
                        "4": "4",
                        "5": "5",
                        "6": "6",
                    })
                    .setValue(String(this.plugin.settings.archiveHeadingDepth))
                    .onChange(async (value) => {
                        this.plugin.settings.archiveHeadingDepth = Number(value);
                        await this.plugin.saveSettings();
                    });
            });

        new DateTreeSetting(this.containerEl.createDiv(), this.plugin);
    }
}
