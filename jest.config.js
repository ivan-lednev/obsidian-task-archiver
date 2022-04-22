/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    transformIgnorePatterns: [
        "<rootDir>/node_modules/(?!escape-string-regexp).+\\.js$",
    ],
    testPathIgnorePatterns: [
        "Util\\.js"
    ],
    testEnvironment: "jsdom",
};
