import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useMotion } from '../hooks/useMotion';
import { haptics } from '../lib/haptics';
import { fillRatio, todayKey, waterToday } from '../lib/hydration';
import { hexWithAlpha } from '../lib/party';
import { sineWavePath } from '../lib/wave';
import { useAppState } from '../state/AppState';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { CountUp } from './CountUp';
import { Skeleton } from './ui/Skeleton';

const BOTTLE_W = 132;
const BOTTLE_H = 168;
const LOG_ML = 250;
const GOAL_OPTIONS_L = [1.5, 2, 2.5, 3];
const RIPPLE_SIZE = 120;

// The dashboard centrepiece: a liquid-fill tracker. Wave crests are static SVG paths
// (see src/lib/wave.ts) animated by translateX alone, never by the `d` prop - path
// data off the UI thread is fragile and janky in Reanimated 4.
export function HydrationBottle() {
  const { userDoc, userDocLoading, logWater, setHydrationGoal } = useAppState();
  const { reduced } = useMotion();
  const [error, setError] = useState<string | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  // Bumps the fill on touch rather than waiting for the write to round-trip through
  // Firestore's onSnapshot; rolled back on a failed write, cleared once the server
  // value catches up so a slow network can't leave the two permanently out of sync.
  const [optimisticMl, setOptimisticMl] = useState<number | null>(null);

  const goalMl = userDoc?.hydrationGoalMl ?? 2000;
  const serverMl = waterToday(userDoc?.waterMl ?? 0, userDoc?.waterDate ?? null, todayKey());
  const waterMl = optimisticMl ?? serverMl;
  const ratio = fillRatio(waterMl, goalMl);
  const goalReached = ratio >= 1;

  const waterY = useSharedValue(BOTTLE_H);
  const waveBackX = useSharedValue(0);
  const waveFrontX = useSharedValue(0);
  const waveScaleY = useSharedValue(1);
  const rippleX = useSharedValue(0);
  const rippleY = useSharedValue(0);
  const rippleProgress = useSharedValue(1);

  useEffect(() => {
    if (optimisticMl !== null && serverMl >= optimisticMl) setOptimisticMl(null);
  }, [serverMl, optimisticMl]);

  useEffect(() => {
    const target = BOTTLE_H * (1 - ratio);
    waterY.value = reduced
      ? withTiming(target, { duration: 200 })
      : withSpring(target, { damping: 14, stiffness: 90 });
  }, [ratio, reduced, waterY]);

  useEffect(() => {
    const target = goalReached ? 1.15 : 1;
    waveScaleY.value = reduced ? target : withTiming(target, { duration: 400 });
  }, [goalReached, reduced, waveScaleY]);

  // A one-shot success buzz, not a repeat every render the ratio happens to sit at 1.
  const successFired = useRef(false);
  useEffect(() => {
    if (goalReached && !successFired.current) {
      successFired.current = true;
      haptics.success();
    }
    if (!goalReached) successFired.current = false;
  }, [goalReached]);

  useEffect(() => {
    if (reduced) {
      waveBackX.value = 0;
      waveFrontX.value = 0;
      return;
    }
    waveBackX.value = withRepeat(
      withTiming(-BOTTLE_W, { duration: 3900, easing: Easing.linear }),
      -1,
      false,
    );
    waveFrontX.value = withRepeat(
      withTiming(-BOTTLE_W, { duration: 2600, easing: Easing.linear }),
      -1,
      false,
    );
  }, [reduced, waveBackX, waveFrontX]);

  const logTap = (x: number, y: number) => {
    setError(null);
    haptics.medium();
    if (!reduced) {
      rippleX.value = x;
      rippleY.value = y;
      rippleProgress.value = 0;
      rippleProgress.value = withTiming(1, { duration: 500 });
    }
    setOptimisticMl(waterMl + LOG_ML);
    logWater(LOG_ML).catch(() => {
      setOptimisticMl(null);
      setError('Could not log water. Try again.');
    });
  };

  const openGoalSheet = () => setGoalOpen(true);

  const tap = Gesture.Tap().onEnd((e) => {
    runOnJS(logTap)(e.x, e.y);
  });
  // Listed first in Exclusive so a held press wins and cancels the tap, rather than
  // both firing.
  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(openGoalSheet)();
    });
  const gesture = Gesture.Exclusive(longPress, tap);

  const waterStyle = useAnimatedStyle(() => ({ transform: [{ translateY: waterY.value }] }));
  const waveBackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: waveBackX.value }, { scaleY: waveScaleY.value }],
  }));
  const waveFrontStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: waveFrontX.value }, { scaleY: waveScaleY.value }],
  }));
  // Same shared value the fill itself is driven from, so the readout's crossfade can
  // never fall a frame behind where the water line actually is.
  const readoutStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      waterY.value,
      [BOTTLE_H / 2 - 16, BOTTLE_H / 2 + 16],
      [colors.surface, colors.text],
    ),
  }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: 1 - rippleProgress.value,
    transform: [
      { translateX: rippleX.value - RIPPLE_SIZE / 2 },
      { translateY: rippleY.value - RIPPLE_SIZE / 2 },
      { scale: rippleProgress.value * 3 },
    ],
  }));

  if (userDocLoading) {
    return <Skeleton style={styles.bottle} />;
  }

  const backPath = sineWavePath(BOTTLE_W * 2, BOTTLE_H, 7);
  const frontPath = sineWavePath(BOTTLE_W * 2, BOTTLE_H, 5);

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={gesture}>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Log 250 millilitres. Currently ${Math.round(waterMl)} of ${Math.round(goalMl)} millilitres.`}
          accessibilityHint="Long press to change your daily goal"
          style={styles.bottle}
        >
          <Animated.View style={[styles.water, waterStyle]}>
            <Animated.View style={[styles.wave, styles.waveBack, waveBackStyle]}>
              <Svg width={BOTTLE_W * 2} height={BOTTLE_H}>
                <Path d={backPath} fill={hexWithAlpha(colors.primary, 0.45)} />
              </Svg>
            </Animated.View>
            <Animated.View style={[styles.wave, waveFrontStyle]}>
              <Svg width={BOTTLE_W * 2} height={BOTTLE_H}>
                <Path d={frontPath} fill={colors.primary} />
              </Svg>
            </Animated.View>
          </Animated.View>

          {!reduced ? (
            <Animated.View pointerEvents="none" style={[styles.ripple, rippleStyle]} />
          ) : null}

          <View style={styles.readout} pointerEvents="none">
            <CountUp value={waterMl} style={[typography.title, readoutStyle]} />
            <Animated.Text style={[styles.goalLine, readoutStyle]}>
              of {Math.round(goalMl)} ml
            </Animated.Text>
            {goalReached ? (
              <Animated.Text style={[styles.goalMet, readoutStyle]}>Goal met</Animated.Text>
            ) : null}
          </View>
        </View>
      </GestureDetector>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <GoalSheet
        visible={goalOpen}
        goalMl={goalMl}
        onClose={() => setGoalOpen(false)}
        onSelect={(ml) => {
          haptics.light();
          setHydrationGoal(ml).catch(() => setError('Could not update your goal. Try again.'));
          setGoalOpen(false);
        }}
      />
    </View>
  );
}

function GoalSheet({
  visible,
  goalMl,
  onClose,
  onSelect,
}: {
  visible: boolean;
  goalMl: number;
  onClose: () => void;
  onSelect: (ml: number) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityLabel="Close">
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={typography.heading}>Daily goal</Text>
          <View style={styles.pillRow}>
            {GOAL_OPTIONS_L.map((litres) => {
              const ml = litres * 1000;
              const active = ml === goalMl;
              return (
                <Pressable
                  key={litres}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${litres} litres`}
                  onPress={() => onSelect(ml)}
                  hitSlop={8}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{litres} L</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xs },
  bottle: {
    width: BOTTLE_W,
    height: BOTTLE_H,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  water: { ...StyleSheet.absoluteFillObject },
  wave: { position: 'absolute', top: 0, left: 0, width: BOTTLE_W * 2, height: BOTTLE_H },
  waveBack: { top: 3 },
  ripple: {
    position: 'absolute',
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    borderRadius: RIPPLE_SIZE / 2,
    backgroundColor: hexWithAlpha(colors.surface, 0.35),
  },
  readout: { alignItems: 'center', gap: 2 },
  goalLine: { ...typography.caption },
  goalMet: { ...typography.caption, fontWeight: '700', marginTop: 2 },
  error: { ...typography.caption, color: colors.danger },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,26,21,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.floating,
  },
  pillRow: { flexDirection: 'row', gap: spacing.xs },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.label, color: colors.text },
  pillTextActive: { color: colors.surface },
});
