// Separate from jest.config.js: rules tests run against the Firebase emulator in a
// plain Node environment, not the RN environment jest-expo sets up.
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/../backend/**/*.test.ts'],
  transform: { '^.+\\.tsx?$': ['babel-jest', { presets: ['babel-preset-expo'] }] },
};
