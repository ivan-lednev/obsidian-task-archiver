/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    // preset: "ts-jest/presets/js-with-babel",
    transformIgnorePatterns: [
        "<rootDir>/node_modules/(?!escape-string-regexp).+\\.js$",
    ],
    testEnvironment: "jsdom",
};
