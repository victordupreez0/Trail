import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';

import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';

// A plain opacity pulse rather than reanimated: this predates useMotion (P7), which
// is where reduced-motion handling and the reanimated-based shimmer land for real.
// Until then this stays a flash-of-empty-state replacement, not a design centrepiece.
export function Skeleton({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.base, style, { opacity }]} />;
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surfaceAlt, borderRadius: radius.sm },
});
