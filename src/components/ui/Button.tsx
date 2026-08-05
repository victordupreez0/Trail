import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, shadow } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
};

const fill: Record<Variant, object> = {
  primary: { backgroundColor: colors.primary, ...shadow.card },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danger, ...shadow.card },
};

const tint: Record<Variant, string> = {
  primary: colors.surface,
  secondary: colors.text,
  ghost: colors.primary,
  danger: colors.surface,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
}: Props) {
  const inert = disabled || loading;

  const handlePress = () => {
    // The concept leans on gestures; a small haptic keeps button taps feeling
    // like part of the same physical language.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inert, busy: loading }}
      onPress={handlePress}
      disabled={inert}
      style={({ pressed }) => [
        styles.base,
        fill[variant],
        pressed && styles.pressed,
        inert && styles.inert,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tint[variant]} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={tint[variant]} /> : null}
          <Text style={[styles.label, { color: tint[variant] }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54, // large tap target, an accessibility commitment from the pitch
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { ...typography.label, fontSize: 16 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  inert: { opacity: 0.45 },
});
