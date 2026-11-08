import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { Trail } from '../../data/trails';
import { colors, difficulty } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

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
    ? difficulty[tone]
    : onDark
      ? { fg: colors.surface, bg: colors.glassOnPhoto }
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
    gap: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.xs,
  },
  label: { ...typography.caption, textTransform: 'capitalize' },
});
