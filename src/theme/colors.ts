// Calm-first palette (inspiration card: reduce stress). Warm paper rather than
// stark white, forest greens, muted earth accents. Nothing shouts except danger.
export const colors = {
  background: '#F5F3ED',
  surface: '#FFFFFF',
  surfaceAlt: '#ECE7DC',
  text: '#1A231E',
  muted: '#6E7A72',
  primary: '#2E6B4F',
  primaryDark: '#1E4A36',
  primarySoft: '#DCE8E0',
  accent: '#C2703D',
  accentSoft: '#F5E4D6',
  danger: '#B3432B',
  dangerSoft: '#F6DED8',
  border: '#E2DCD0',
  shadow: '#1A231E',
};

// A member's avatar/marker colour is derived from their uid (see memberColor in
// src/lib/party.ts), never chosen or stored, so every device agrees on the same
// person's colour for free. Kept distinguishable at a glance but still inside the
// calm palette, nothing neon.
export const memberPalette = ['#2F6B4F', '#B3432B', '#5C6BC0', '#C2703D', '#3E7C8A', '#8A5FA6'];

// The one-off ceremony gradient for app/hike/summary.tsx. Dawn navy through the
// existing accent terracotta into a warm gold - the only sunrise-toned stops in the
// app, so they live here rather than as a literal on that one screen.
export const sunrise = ['#2E3B55', '#6B4E71', colors.accent, '#F5C177'] as const;

// Consistent soft elevation, pairing iOS shadow props with Android elevation.
export const shadow = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  floating: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
};
