import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import PagerView, { type PagerViewOnPageScrollEvent } from 'react-native-pager-view';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Button } from '../src/components/ui/Button';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { useMotion } from '../src/hooks/useMotion';
import { sineWavePath } from '../src/lib/wave';
import { useAppState } from '../src/state/AppState';
import { colors } from '../src/theme/colors';
import { radius, spacing } from '../src/theme/spacing';
import { typography } from '../src/theme/typography';

const RIDGE_HEIGHT = 190;
const RIDGE_MARGIN = 130;
// Back to front: fewer, taller peaks per layer reads as a mountain range rather than
// water (compare src/lib/wave.ts's water waves - more periods, small amplitude).
// Rates differ per layer for the parallax; sign is negative so the range drifts left
// as you swipe forward, alongside the "Next" direction.
const RIDGES = [
  { amplitude: 22, periods: 2.5, color: colors.surfaceAlt, factor: -18 },
  { amplitude: 32, periods: 2, color: colors.primarySoft, factor: -36 },
  { amplitude: 46, periods: 1.5, color: colors.primary, factor: -60 },
] as const;

// One slide per inspiration card: reduce stress, geolocation, gesture-first.
const slides = [
  {
    icon: 'leaf-outline',
    title: 'Do less,\nnot more',
    body: 'Trail protects the calm a hike already gives you. Fewer taps, fewer alerts, more mountain.',
  },
  {
    icon: 'location-outline',
    title: 'Keep your\npeople close',
    body: 'See your whole party on one shared map, live, without anyone having to check in.',
  },
  {
    icon: 'hand-left-outline',
    title: 'Built for\nyour hands',
    body: 'Swipe to move through trails. Big targets, high contrast, and clear buttons where safety needs them.',
  },
] as const;

export default function Onboarding() {
  const { completeOnboarding } = useAppState();
  const { reduced } = useMotion();
  const { width } = useWindowDimensions();
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  // Continuous 0..slides.length-1 drag progress, not the discrete page index -
  // that's what makes the ridges drift instead of snapping between slides.
  const progress = useSharedValue(0);
  const isLast = page === slides.length - 1;

  const finish = () => {
    completeOnboarding();
    router.replace('/(auth)/login');
  };

  const ridgeWidth = width + RIDGE_MARGIN * 2;

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.ridgeBand} pointerEvents="none">
        {RIDGES.map((ridge) => (
          <Ridge
            key={ridge.factor}
            width={ridgeWidth}
            progress={progress}
            reduced={reduced}
            {...ridge}
          />
        ))}
      </View>

      <View style={styles.topRow}>
        <View style={styles.brand}>
          <Ionicons name="triangle" size={17} color={colors.primary} />
          <Text style={styles.brandText}>Trail</Text>
        </View>
        {!isLast ? (
          <Pressable
            onPress={finish}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
        onPageScroll={(e: PagerViewOnPageScrollEvent) => {
          progress.value = e.nativeEvent.position + e.nativeEvent.offset;
        }}
      >
        {slides.map((slide) => (
          <View key={slide.title} style={styles.slide}>
            <View style={styles.iconCircle}>
              <Ionicons name={slide.icon} size={38} color={colors.primary} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </PagerView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <View key={slide.title} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <Button
          label={isLast ? 'Get started' : 'Next'}
          icon={isLast ? 'arrow-forward' : undefined}
          onPress={() => (isLast ? finish() : pagerRef.current?.setPage(page + 1))}
        />
      </View>
    </ScreenContainer>
  );
}

function Ridge({
  width,
  amplitude,
  periods,
  color,
  factor,
  progress,
  reduced,
}: {
  width: number;
  amplitude: number;
  periods: number;
  color: string;
  factor: number;
  progress: ReturnType<typeof useSharedValue<number>>;
  reduced: boolean;
}) {
  const d = sineWavePath(width, RIDGE_HEIGHT, amplitude, periods);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: reduced ? 0 : progress.value * factor }],
  }));

  return (
    <Animated.View style={[styles.ridgeLayer, { width }, style]}>
      <Svg width={width} height={RIDGE_HEIGHT}>
        <Path d={d} fill={color} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.lg },
  // Cancels ScreenContainer's own horizontal padding so the ridges reach the true
  // screen edges, then clips there - each layer's own Svg is wider still, so a shift
  // never reveals a hard edge inside that clipped band.
  ridgeBand: {
    position: 'absolute',
    left: -spacing.lg,
    right: -spacing.lg,
    bottom: 0,
    height: RIDGE_HEIGHT,
    overflow: 'hidden',
  },
  ridgeLayer: { position: 'absolute', bottom: 0, left: -RIDGE_MARGIN },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { ...typography.label, color: colors.primaryDark, letterSpacing: 0.5 },
  skip: { ...typography.label, color: colors.muted },
  pager: { flex: 1 },
  slide: { flex: 1, justifyContent: 'center', gap: spacing.md },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.display, fontSize: 38, lineHeight: 44 },
  body: { ...typography.body, color: colors.muted, fontSize: 17, lineHeight: 26 },
  footer: { gap: spacing.lg },
  dots: { flexDirection: 'row', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 24 },
});
