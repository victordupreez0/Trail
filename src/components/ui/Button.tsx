import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useMotion } from '../../hooks/useMotion';
import { haptics } from '../../lib/haptics';
import { colors, shadow } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const { spring, reduced } = useMotion();
  // 1 at rest, 0.97 pressed; opacity is derived from the same value rather than a
  // second one, so the two never fall out of sync mid-spring.
  const scale = useSharedValue(1);

  const handlePress = () => {
    // The concept leans on gestures; a small haptic keeps button taps feeling
    // like part of the same physical language.
    haptics.light();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0.97, 1], [0.82, 1]),
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inert, busy: loading }}
      onPress={handlePress}
      onPressIn={() => {
        scale.value = reduced ? 0.97 : withSpring(0.97, spring);
      }}
      onPressOut={() => {
        scale.value = reduced ? 1 : withSpring(1, spring);
      }}
      disabled={inert}
      style={[styles.base, fill[variant], inert && styles.inert, animatedStyle]}
    >
      {loading ? (
        <ActivityIndicator color={tint[variant]} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={tint[variant]} /> : null}
          <Text style={[styles.label, { color: tint[variant] }]}>{label}</Text>
        </View>
      )}
    </AnimatedPressable>
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
  inert: { opacity: 0.45 },
});
