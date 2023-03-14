module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "airbnb-base",
        "airbnb-typescript/base",
        "plugin:@typescript-eslint/recommended",
        "plugin:jest/recommended",
        "plugin:solid/recommended",
        "prettier",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.eslint.json",
    },
    plugins: ["@typescript-eslint", "jest", "unused-imports", "solid", "lodash-fp"],
    rules: {
        "jest/expect-expect": [
            "warn",
            {
                assertFunctionNames: ["expect", "*Check*"],
            },
        ],
        "lodash-fp/consistent-compose": "off",
        "lodash-fp/consistent-name": ["error", "_"],
        "lodash-fp/no-argumentless-calls": "error",
        "lodash-fp/no-chain": "error",
        "lodash-fp/no-extraneous-args": "error",
        "lodash-fp/no-extraneous-function-wrapping": "error",
        "lodash-fp/no-extraneous-iteratee-args": "error",
        "lodash-fp/no-extraneous-partials": "error",
        "lodash-fp/no-for-each": "off",
        "lodash-fp/no-partial-of-curried": "error",
        "lodash-fp/no-single-composition": "error",
        "lodash-fp/no-submodule-destructuring": "error",
        "lodash-fp/no-unused-result": "error",
        "lodash-fp/prefer-compact": "error",
        "lodash-fp/prefer-composition-grouping": "error",
        "lodash-fp/prefer-constant": [
            "error",
            {
                arrowFunctions: false,
            },
        ],
        "lodash-fp/prefer-flat-map": "error",
        "lodash-fp/prefer-get": "error",
        "lodash-fp/prefer-identity": [
            "error",
            {
                arrowFunctions: false,
            },
        ],
        "lodash-fp/preferred-alias": "off",
        "lodash-fp/use-fp": "error",
        "no-restricted-syntax": [
            "error",
            {
                selector: "ForInStatement",
                message:
                    "for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.",
            },
            {
                selector: "LabeledStatement",
                message:
                    "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.",
            },
            {
                selector: "WithStatement",
                message:
                    "`with` is disallowed in strict mode because it makes code impossible to predict and optimize.",
            },
        ],
        "import/prefer-default-export": "off",
        "import/no-default-export": "error",
    },
};
