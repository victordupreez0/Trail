import type { TextStyle } from 'react-native';

// A small scale, not a full type system — add sizes when a screen actually needs one.
export const typography: Record<string, TextStyle> = {
  title: { fontSize: 28, fontWeight: '700' },
  heading: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '500' },
};
