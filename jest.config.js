export default {
  clearMocks: true,
  transform: {},
  testEnvironment: "jsdom",
  coverageProvider: "v8",
  // apps/* and packages/* carry upstream's vitest suites; not jest's to run.
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/tests/e2e/",
    "<rootDir>/packages/",
    "<rootDir>/apps/",
  ],
  modulePathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/e2e/"],
  coveragePathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/tests/E2E/",
  ],
};
