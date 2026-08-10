export default {
  clearMocks: true,
  transform: {},
  testEnvironment: "jsdom",
  coverageProvider: "v8",
  // packages/* carry upstream's vitest suites; they are not jest's to run.
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/tests/e2e/",
    "<rootDir>/packages/",
  ],
  modulePathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/e2e/"],
  coveragePathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/tests/E2E/",
  ],
};
