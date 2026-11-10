// Reanimated 4.7 and Worklets 0.13 need their own resolver to load their Jest-safe code
// under the native preset. This runs theirs first, then hands off to the preset's
// resolver for everything else, so React Native's own mapping is left as it was.
const presetResolver = require('@react-native/jest-preset/jest/resolver');
const reanimatedResolver = require('react-native-reanimated/jest/resolver');

module.exports = (request, options) =>
  reanimatedResolver(request, {
    ...options,
    defaultResolver: (req, opts) =>
      presetResolver(req, { ...opts, defaultResolver: options.defaultResolver }),
  });
