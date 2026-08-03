import { StyleSheet, Text, View } from 'react-native';

import type { Trail } from '../../data/trails';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const difficultyColor: Record<Trail['difficulty'], string> = {
  easy: '#3D8A5F',
  moderate: '#B5860B',
  hard: colors.danger,
};

export function Chip({ label, tone }: { label: string; tone?: Trail['difficulty'] }) {
  const color = tone ? difficultyColor[tone] : colors.muted;
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: { ...typography.caption, textTransform: 'capitalize' },
});
