import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';

import { useMotion } from '../../hooks/useMotion';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';

// A plain opacity pulse, held still for anyone who has asked for reduced motion.
export function Skeleton({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const { reduced } = useMotion();
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduced]);

  return <Animated.View style={[styles.base, style, { opacity }]} />;
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surfaceAlt, borderRadius: radius.sm },
});
