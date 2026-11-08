// Separate from jest.config.js: rules tests run against the Firebase emulator in a
// plain Node environment, not the RN environment jest-expo sets up.
module.exports = {
  testEnvironment: 'node',
  // The tests live outside this folder, so Jest has to be told to look there and
  // where to find their packages.
  roots: ['<rootDir>/../backend'],
  modulePaths: ['<rootDir>/node_modules'],
  testMatch: ['**/*.test.ts'],
  // Connecting to the emulator on a cold start can outlast Jest's 5 second default.
  testTimeout: 30_000,
  transform: { '^.+\\.tsx?$': ['babel-jest', { presets: ['babel-preset-expo'] }] },
};
