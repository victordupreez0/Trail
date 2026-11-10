module.exports = {
  preset: 'jest-expo',
  resolver: '<rootDir>/jest.resolver.js',
  setupFiles: ['react-native-gesture-handler/jestSetup'],
  // A cold start under load can outlast Jest's 5 second default on the first test.
  testTimeout: 30_000,
  // jest-expo workers are memory hungry, and one per core can crash a busy machine.
  maxWorkers: 3,
  testPathIgnorePatterns: ['/node_modules/', '/backend/'],
  // Counts every file in src/lib, not just the ones a test happens to import, so the
  // coverage number can't look better by leaving files out.
  collectCoverageFrom: ['src/lib/**/*.ts'],
};
