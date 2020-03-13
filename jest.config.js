// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js}'
  ],
  testPathIgnorePatterns: [
    'test/',
    'resources',
    'docs',
    'dist',
    'deployment',
    'compiler',
    'build_utils',
    '.circleci'
  ],
  testEnvironment: "node",
};
