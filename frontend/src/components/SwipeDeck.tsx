import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, type RefObject } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { Trail } from '../data/trails';
import { useMotion } from '../hooks/useMotion';
import { haptics } from '../lib/haptics';
import { decideSwipe, SWIPE_THRESHOLD, type SwipeDecision } from '../lib/swipe';
import { colors, shadow } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { TrailCard } from './TrailCard';
import { EmptyState } from './ui/EmptyState';

export type { SwipeDecision };

const OFF_SCREEN = 900;
const CARD_HEIGHT = 340;
const FLY_OFF_MS = 220;

type Fling = (decision: SwipeDecision) => void;

export function SwipeDeck({
  data,
  onDecision,
  onPressCard,
  onStartOver,
}: {
  data: Trail[];
  onDecision: (trail: Trail, decision: SwipeDecision) => void;
  onPressCard: (trail: Trail) => void;
  onStartOver?: () => void;
}) {
  // How far the top card has been dragged, which is what eases the next card forward.
  const dragY = useSharedValue(0);
  const flingTop = useRef<Fling>(() => {});
  const [current, next] = data;

  if (!current) {
    return (
      <EmptyState
        title="That's every trail"
        body="You've been through the whole list. Check Saved for the ones you kept."
        icon="checkmark-done-outline"
        action={
          onStartOver ? { label: 'See skipped trails again', onPress: onStartOver } : undefined
        }
      />
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.stack}>
        {/* Keyed by trail, so the card behind becomes the top card without remounting
            and its photo never has to load twice. */}
        {(next ? [next, current] : [current]).map((trail) => (
          <DeckCard
            key={trail.id}
            trail={trail}
            isTop={trail.id === current.id}
            dragY={dragY}
            flingRef={flingTop}
            onDecision={onDecision}
            onPress={onPressCard}
          />
        ))}
      </View>

      {/* Gesture-first is the constraint, but the actions still need a visible,
          reachable fallback, because swiping is not discoverable on its own. */}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip this trail"
          onPress={() => flingTop.current('skip')}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Ionicons name="close" size={26} color={colors.muted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save this trail"
          onPress={() => flingTop.current('save')}
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
        {data.length} {data.length === 1 ? 'trail' : 'trails'} left
      </Text>
    </View>
  );
}

function DeckCard({
  trail,
  isTop,
  dragY,
  flingRef,
  onDecision,
  onPress,
}: {
  trail: Trail;
  isTop: boolean;
  dragY: SharedValue<number>;
  flingRef: RefObject<Fling>;
  onDecision: (trail: Trail, decision: SwipeDecision) => void;
  onPress: (trail: Trail) => void;
}) {
  const { reduced } = useMotion();
  // Each card owns its offset. Sharing one would mean resetting it between cards,
  // and that reset is what used to flash the old card back into the middle.
  const y = useSharedValue(0);
  const flying = useSharedValue(false);

  useAnimatedReaction(
    () => y.value,
    (value) => {
      if (isTop) dragY.value = value;
    },
    [isTop],
  );

  const commit = (decision: SwipeDecision) => onDecision(trail, decision);
  const openCard = () => onPress(trail);
  // A save/skip is a committed decision, not a lightweight tap.
  const buzz = () => haptics.medium();

  // Shared by the swipe and the buttons, so the two paths can't drift apart.
  const flyOff = (decision: SwipeDecision) => {
    'worklet';
    if (flying.value) return;
    flying.value = true;
    runOnJS(buzz)();
    y.value = withTiming(
      decision === 'save' ? -OFF_SCREEN : OFF_SCREEN,
      { duration: reduced ? 0 : FLY_OFF_MS },
      (finished) => {
        'worklet';
        if (finished) runOnJS(commit)(decision);
      },
    );
  };

  useEffect(() => {
    if (isTop) flingRef.current = (decision) => runOnUI(flyOff)(decision);
  });

  const pan = Gesture.Pan()
    .enabled(isTop)
    // Let horizontal drags fall through to the PagerView underneath, so swiping
    // between screens still works while a card is on top.
    .activeOffsetY([-12, 12])
    .failOffsetX([-24, 24])
    .onUpdate((e) => {
      if (!flying.value) y.value = e.translationY;
    })
    .onEnd((e) => {
      if (flying.value) return;
      const decision = decideSwipe(e.translationY);
      if (decision) flyOff(decision);
      else y.value = withSpring(0, { damping: 18 });
    });

  const tap = Gesture.Tap()
    .enabled(isTop)
    .maxDistance(10)
    .onEnd((_e, success) => {
      if (success) runOnJS(openCard)();
    });

  const cardStyle = useAnimatedStyle(() => {
    if (isTop) {
      return {
        opacity: 1,
        transform: [
          { translateY: y.value },
          { rotate: `${interpolate(y.value, [-300, 0, 300], [-6, 0, 6])}deg` },
          { scale: 1 },
        ],
      };
    }
    const progress = interpolate(Math.abs(dragY.value), [0, SWIPE_THRESHOLD], [0, 1], 'clamp');
    return {
      opacity: 0.55 + progress * 0.45,
      transform: [{ translateY: 0 }, { rotate: '0deg' }, { scale: 0.94 + progress * 0.06 }],
    };
  }, [isTop]);

  const saveBadge = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [-SWIPE_THRESHOLD, -20, 0], [1, 0, 0], 'clamp'),
  }));

  const skipBadge = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, 20, SWIPE_THRESHOLD], [0, 0, 1], 'clamp'),
  }));

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <Animated.View
        style={[styles.cardSlot, cardStyle]}
        pointerEvents={isTop ? 'auto' : 'none'}
        accessible={isTop}
        accessibilityRole="button"
        accessibilityLabel={`${trail.name}. Open trail details.`}
        onAccessibilityTap={openCard}
      >
        <TrailCard trail={trail} height={CARD_HEIGHT} />
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
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, justifyContent: 'center' },
  stack: { height: CARD_HEIGHT, justifyContent: 'center' },
  cardSlot: { ...StyleSheet.absoluteFill },
  badge: {
    position: 'absolute',
    top: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
