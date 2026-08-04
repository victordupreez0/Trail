// Calm-first palette (inspiration card: reduce stress). Warm paper rather than
// stark white, forest greens, muted earth accents — nothing shouts except danger.
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
  border: '#E2DCD0',
  shadow: '#1A231E',
};

// Consistent soft elevation — iOS shadow props + Android elevation together.
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
