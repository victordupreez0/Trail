import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { Trail } from '../../data/trails';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const difficultyTone: Record<Trail['difficulty'], { fg: string; bg: string }> = {
  easy: { fg: '#2E6B4F', bg: '#DCE8E0' },
  moderate: { fg: '#8A6512', bg: '#F5EAD0' },
  hard: { fg: '#9C3A26', bg: '#F6DED8' },
};

export function Chip({
  label,
  tone,
  icon,
  onDark = false,
}: {
  label: string;
  tone?: Trail['difficulty'];
  icon?: keyof typeof Ionicons.glyphMap;
  onDark?: boolean;
}) {
  const palette = tone
    ? difficultyTone[tone]
    : onDark
      ? { fg: colors.surface, bg: 'rgba(255,255,255,0.22)' }
      : { fg: colors.muted, bg: colors.surfaceAlt };

  return (
    <View style={[styles.chip, { backgroundColor: palette.bg }]}>
      {icon ? <Ionicons name={icon} size={12} color={palette.fg} /> : null}
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
  },
  label: { ...typography.caption, textTransform: 'capitalize' },
});
