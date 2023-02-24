// prettier.config.js or .prettierrc.js
module.exports = {
    tabWidth: 4,
    printWidth: 88,
    importOrder: ["^obsidian$", "<THIRD_PARTY_MODULES>", "^\\./", "^\\.\\./"],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
    endOfLine: "crlf",
    overrides: [
        {
            files: ["*.tsx"],
            options: {
                tabWidth: 2,
            },
        },
    ],
};
