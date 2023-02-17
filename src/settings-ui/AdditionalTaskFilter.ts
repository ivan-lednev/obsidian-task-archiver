import { Setting } from "obsidian";

import { TryOutComponent } from "./TryOutComponent";

import ObsidianTaskArchiver from "../ObsidianTaskArchiverPlugin";

export class AdditionalTaskFilter {
    private tryOutComponent: TryOutComponent;
    private tryOutInput = "Feed the cat #task";
    private patternInput = this.plugin.settings.additionalTaskPattern;

    constructor(
        private readonly containerEl: HTMLDivElement,
        private readonly plugin: ObsidianTaskArchiver
    ) {
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
                        this.setPatternInput(value);

                        if (validatePattern(value)) {
                            this.plugin.settings.additionalTaskPattern = value;
                            await this.plugin.saveSettings();
                        }
                    });
            });

        this.tryOutComponent = new TryOutComponent(
            this.containerEl,
            this.tryOutInput,
            "",
            (value) => {
                this.setTryOutInput(value);
            }
        );

        this.displayTestResult();
    }

    private setPatternInput(value: string) {
        this.patternInput = value;
        this.displayTestResult();
    }

    private setTryOutInput(value: string) {
        this.tryOutInput = value;
        this.displayTestResult();
    }

    private displayTestResult() {
        this.tryOutComponent.displayOutput(this.getValidationMessage());
    }

    private getValidationMessage() {
        if (!validatePattern(this.patternInput)) {
            return "🕱 Invalid pattern";
        }

        if (this.tryOutInput.trim().length === 0) {
            return "Empty";
        }

        const match = new RegExp(this.patternInput).test(this.tryOutInput);
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
