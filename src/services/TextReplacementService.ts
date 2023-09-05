import { Settings } from "../Settings";
import { Block } from "../model/Block";

export class TextReplacementService {
    constructor(private readonly settings: Settings) {}

    replaceText = (block: Block) => {
        if (this.settings.textReplacement.applyReplacement) {
            return this.replaceTextDeep(block);
        }
        return block;
    };

    private replaceTextDeep(block: Block) {
        const { regex, replacement } = this.settings.textReplacement;
        const compiledRegex = new RegExp(regex, "g");

        block.text = block.text.replace(compiledRegex, replacement);
        block.children = block.children.map((child) => this.replaceTextDeep(child));

        return block;
    }
}
