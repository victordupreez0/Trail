import type { TextStyle } from 'react-native';

// Generous line heights and a wide jump between steps, because space is what makes a
// screen feel calm rather than busy.
export const typography = {
  display: { fontSize: 34, fontWeight: '700', letterSpacing: -0.5, lineHeight: 40 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3, lineHeight: 32 },
  heading: { fontSize: 19, fontWeight: '600', lineHeight: 25 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
  caption: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
} satisfies Record<string, TextStyle>;
