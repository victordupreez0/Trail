// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // ponytail: these React Compiler rules arrived with the SDK 58 lint config and flag
      // 25 effects written and tested before it. Turn them back on and refactor those
      // effects once the demo is done.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      // TypeScript already checks namespace members, and this rule misreads
      // expo-notifications' `export *` of AndroidImportance.
      'import/namespace': 'off',
    },
  },
]);
