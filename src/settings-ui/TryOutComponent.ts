import { Setting, TextAreaComponent } from "obsidian";

export class TryOutComponent {
    private resultTextArea: TextAreaComponent;

    constructor(
        private readonly containerEl: HTMLElement,
        private readonly initialInput: string,
        private readonly initialOutput: string,
        private readonly onChange: (value: string) => void | Promise<void>
    ) {
        this.display();
    }

    private display() {
        new Setting(this.containerEl).then((setting) => {
            setting.setName("Try it out");
            setting.setDesc("The output gets updated on your input");

            setting.controlEl.appendText("Input: ");
            setting.addTextArea((input) => {
                input.setPlaceholder("Input");
                input.setValue(this.initialInput);
                input.onChange(this.onChange);
            });

            setting.controlEl.appendText("Output: ");
            setting.addTextArea((output) => {
                this.resultTextArea = output;
                output.setDisabled(true);
                output.setPlaceholder("Output");
                output.setValue(this.initialOutput);
            });
        });
    }

    displayOutput(output: string) {
        this.resultTextArea.setValue(output);
    }
}
