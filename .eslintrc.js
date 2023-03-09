module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:jest/recommended",
        "plugin:solid/recommended",
        "prettier",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    plugins: ["@typescript-eslint", "jest", "unused-imports", "solid"],
    rules: {
        "jest/expect-expect": [
            "warn",
            {
                assertFunctionNames: ["expect", "*Check*"],
            },
        ],
    },
};
