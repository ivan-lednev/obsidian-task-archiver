/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    transformIgnorePatterns: [
        "<rootDir>/node_modules/(?!escape-string-regexp).+\\.js$",
    ],
    preset: "solid-jest/preset/browser",
    setupFilesAfterEnv: ["<rootDir>/support/jest-setup.ts"],
    testPathIgnorePatterns: ["test-util/"],
    testEnvironment: "jsdom",
    coverageThreshold: {
        global: {
            lines: 97,
            statements: 97,
            functions: 100,
            branches: 89,
        },
        "./src/settings-ui": {
            lines: 30,
            statements: 30,
            functions: 30,
            branches: 30,
        },
    },
};
