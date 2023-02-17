import { Setting } from "obsidian";

import { TryOutComponent } from "./TryOutComponent";

import ObsidianTaskArchiver from "../ObsidianTaskArchiverPlugin";

export class AdditionalTaskFilter {
    private tryOutComponent: TryOutComponent;
    private tryOutInput = "Feed the cat #task";
    private patternInput: string;

    constructor(
        private readonly containerEl: HTMLDivElement,
        private readonly plugin: ObsidianTaskArchiver
    ) {
        this.patternInput = plugin.settings.additionalTaskPattern;
        this.display();
    }

    private display() {
        this.containerEl.empty();
        this.containerEl.createEl("h2", { text: "Task filter settings" });

        new Setting(this.containerEl)
            .setName("Additional task pattern")
            .setDesc(
                createFragment((fragment) => {
                    fragment.append(
                        "Only archive tasks matching this pattern, typically '#task' but can be anything.",
                        createEl("br"),
                        "When left empty, all the completed tasks are going to be archived."
                    );
                })
            )
            .addText((textComponent) => {
                textComponent
                    .setValue(this.plugin.settings.additionalTaskPattern)
                    .onChange(async (value) => {
                        this.patternInput = value;
                        if (!validatePattern(value)) {
                            this.tryOutComponent.displayOutput("🕱 Invalid pattern");
                            return;
                        }

                        this.plugin.settings.additionalTaskPattern = value;
                        await this.plugin.saveSettings();
                        this.displayTestResult(this.tryOutInput);
                    });
            });

        this.tryOutComponent = new TryOutComponent(
            this.containerEl,
            this.tryOutInput,
            "",
            (value: string) => {
                this.tryOutInput = value;
                this.displayTestResult(value);
            }
        );

        this.displayTestResult(this.tryOutInput);
    }

    private displayTestResult(input: string) {
        this.tryOutComponent.displayOutput(this.getValidationMessage(input));
    }

    private getValidationMessage(input: string) {
        if (!validatePattern(this.patternInput)) {
            return "🕱 Invalid pattern";
        }

        if (input.trim().length === 0) {
            return "Empty";
        }

        const match = new RegExp(this.patternInput).test(input);
        if (match) {
            return "✔️ Will be archived";
        }

        return "❌ Won't be archived";
    }
}

function validatePattern(pattern: string) {
    try {
        new RegExp(pattern);
        return true;
    } catch (e) {
        return false;
    }
}
