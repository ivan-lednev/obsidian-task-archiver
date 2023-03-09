/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    transformIgnorePatterns: [
        "<rootDir>/node_modules/(?!escape-string-regexp).+\\.js$",
    ],
    testPathIgnorePatterns: ["test-util/"],
    testEnvironment: "jsdom",
    coverageThreshold: {
        global: {
            lines: 97,
            statements: 97,
            functions: 100,
            branches: 89,
        },
    },
};
