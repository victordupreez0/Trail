// Calm-first palette (inspiration card: reduce stress). Warm paper rather than
// stark white, forest greens, muted earth accents. Nothing shouts except danger.
export const colors = {
  background: '#F5F3ED',
  surface: '#FFFFFF',
  surfaceAlt: '#ECE7DC',
  text: '#1A231E',
  // Dark enough for small text to pass the 4.5:1 contrast guideline on every surface.
  muted: '#5F6B63',
  primary: '#2E6B4F',
  primaryDark: '#1E4A36',
  primarySoft: '#DCE8E0',
  accent: '#C2703D',
  accentSoft: '#F5E4D6',
  // accent and danger are for icons and fills. Small text on their soft backgrounds
  // needs these darker versions to stay readable in sunlight.
  accentText: '#8F4A1E',
  danger: '#B3432B',
  dangerSoft: '#F6DED8',
  dangerText: '#8E2F1B',
  border: '#E2DCD0',
  shadow: '#1A231E',
  onPhoto: 'rgba(255,255,255,0.88)',
  glassOnPhoto: 'rgba(255,255,255,0.22)',
  liveOnPhoto: '#7BE0A6',
  backdrop: 'rgba(15,26,21,0.35)',
};

export const difficulty = {
  easy: { fg: colors.primary, bg: colors.primarySoft },
  moderate: { fg: '#7A5A10', bg: '#F5EAD0' },
  hard: { fg: colors.dangerText, bg: colors.dangerSoft },
};

// Photos vary wildly in brightness, so these guarantee text on top stays readable.
export const scrims = {
  card: ['transparent', 'rgba(15,26,21,0.25)', 'rgba(15,26,21,0.88)'],
  hero: ['rgba(15,26,21,0.15)', 'rgba(15,26,21,0.85)'],
  detail: ['rgba(15,26,21,0.45)', 'transparent', colors.background],
} as const;

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
