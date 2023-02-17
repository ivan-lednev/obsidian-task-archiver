import { Setting, TextAreaComponent } from "obsidian";

export class TryOutComponent {
    private resultTextArea: TextAreaComponent;
    private inputTextArea: TextAreaComponent;

    constructor(
        private readonly containerEl: HTMLElement,
        private readonly onChange: (value: string) => void | Promise<void>
    ) {
        this.display();
    }

    setOutput(output: string) {
        this.resultTextArea.setValue(output);
    }

    setInput(value: string) {
        this.inputTextArea.setValue(value);
    }

    private display() {
        new Setting(this.containerEl).then((setting) => {
            setting.setName("Try it out");
            setting.setDesc("The output gets updated on your input");

            setting.controlEl.appendText("Input: ");
            setting.addTextArea((input) => {
                this.inputTextArea = input;
                input.setPlaceholder("Input");
                input.onChange(this.onChange);
            });

            setting.controlEl.appendText("Output: ");
            setting.addTextArea((output) => {
                this.resultTextArea = output;
                output.setDisabled(true);
                output.setPlaceholder("Output");
            });
        });
    }
}
