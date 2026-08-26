import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, shadow } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
});
