import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { Trail } from '../data/trails';
import { haptics } from '../lib/haptics';
import { decideSwipe, SWIPE_THRESHOLD, type SwipeDecision } from '../lib/swipe';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { TrailCard } from './TrailCard';
import { EmptyState } from './ui/EmptyState';

export type { SwipeDecision };

const OFF_SCREEN = 900;

export function SwipeDeck({
  data,
  onDecision,
  onPressCard,
}: {
  data: Trail[];
  onDecision: (trail: Trail, decision: SwipeDecision) => void;
  onPressCard?: (trail: Trail) => void;
}) {
  const [index, setIndex] = useState(0);
  const translateY = useSharedValue(0);

  const current = data[index];
  const next = data[index + 1];

  const advance = (decision: SwipeDecision) => {
    if (current) onDecision(current, decision);
    translateY.value = 0;
    setIndex((i) => i + 1);
  };

  // A save/skip is a committed decision, not a lightweight tap.
  const buzz = () => haptics.medium();

  // Also driven by the buttons below, so the two paths can't drift apart.
  const fling = (decision: SwipeDecision) => {
    buzz();
    translateY.value = withTiming(
      decision === 'save' ? -OFF_SCREEN : OFF_SCREEN,
      { duration: 240 },
      (finished) => {
        'worklet';
        if (finished) runOnJS(advance)(decision);
      },
    );
  };

  const pan = Gesture.Pan()
    // Let horizontal drags fall through to the PagerView underneath, so swiping
    // between screens still works while a card is on top.
    .activeOffsetY([-12, 12])
    .failOffsetX([-24, 24])
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const decision = decideSwipe(e.translationY);
      if (decision) {
        runOnJS(buzz)();
        translateY.value = withTiming(
          decision === 'save' ? -OFF_SCREEN : OFF_SCREEN,
          { duration: 200 },
          (finished) => {
            'worklet';
            if (finished) runOnJS(advance)(decision);
          },
        );
      } else {
        translateY.value = withSpring(0, { damping: 18 });
      }
    });

  const tap = Gesture.Tap()
    .maxDistance(10)
    .onEnd(() => {
      if (onPressCard && current) runOnJS(onPressCard)(current);
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${interpolate(translateY.value, [-300, 0, 300], [-6, 0, 6])}deg` },
    ],
  }));

  const saveBadge = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-SWIPE_THRESHOLD, -20, 0], [1, 0, 0], 'clamp'),
  }));

  const skipBadge = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, 20, SWIPE_THRESHOLD], [0, 0, 1], 'clamp'),
  }));

  const behindStyle = useAnimatedStyle(() => {
    const progress = interpolate(Math.abs(translateY.value), [0, SWIPE_THRESHOLD], [0, 1], 'clamp');
    return {
      transform: [{ scale: 0.94 + progress * 0.06 }],
      opacity: 0.55 + progress * 0.45,
    };
  });

  if (!current) {
    return (
      <EmptyState
        title="That's every trail"
        body="You've been through the whole list. Check Saved for the ones you kept."
        icon="checkmark-done-outline"
      />
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.stack}>
        {next ? (
          <Animated.View style={[styles.cardSlot, behindStyle]} pointerEvents="none">
            <TrailCard trail={next} height={340} />
          </Animated.View>
        ) : null}

        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.cardSlot, cardStyle]}>
            <TrailCard trail={current} height={340} />
            <Animated.View style={[styles.badge, styles.saveBadge, saveBadge]}>
              <Ionicons name="bookmark" size={16} color={colors.surface} />
              <Text style={styles.badgeText}>Save</Text>
            </Animated.View>
            <Animated.View style={[styles.badge, styles.skipBadge, skipBadge]}>
              <Ionicons name="close" size={16} color={colors.surface} />
              <Text style={styles.badgeText}>Skip</Text>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Gesture-first is the constraint, but the actions still need a visible,
          reachable fallback, because swiping is not discoverable on its own. */}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip this trail"
          onPress={() => fling('skip')}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Ionicons name="close" size={26} color={colors.muted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save this trail"
          onPress={() => fling('save')}
          style={({ pressed }) => [
            styles.action,
            styles.actionPrimary,
            pressed && styles.actionPressed,
          ]}
        >
          <Ionicons name="bookmark" size={24} color={colors.surface} />
        </Pressable>
      </View>

      <Text style={styles.counter}>
        {index + 1} of {data.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, justifyContent: 'center' },
  stack: { height: 340, justifyContent: 'center' },
  cardSlot: { ...StyleSheet.absoluteFillObject },
  badge: {
    position: 'absolute',
    top: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  saveBadge: { left: spacing.md, backgroundColor: colors.primary },
  skipBadge: { right: spacing.md, backgroundColor: colors.muted },
  badgeText: { ...typography.label, color: colors.surface },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  action: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  actionPrimary: { backgroundColor: colors.primary },
  actionPressed: { transform: [{ scale: 0.92 }], opacity: 0.9 },
  counter: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
