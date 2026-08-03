import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { Trail } from '../data/trails';
import { decideSwipe, type SwipeDecision } from '../lib/swipe';
import { TrailCard } from './TrailCard';
import { EmptyState } from './ui/EmptyState';

export type { SwipeDecision };

const OFF_SCREEN_DISTANCE = 700;

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
    onDecision(current, decision);
    translateY.value = 0;
    setIndex((i) => i + 1);
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const decision = decideSwipe(e.translationY);
      if (decision) {
        translateY.value = withSpring(
          decision === 'save' ? -OFF_SCREEN_DISTANCE : OFF_SCREEN_DISTANCE,
          { velocity: e.velocityY },
          () => runOnJS(advance)(decision),
        );
      } else {
        translateY.value = withSpring(0);
      }
    });

  // Race against pan so a quick tap opens the trail while a drag still swipes it —
  // the tap only "wins" if it ends before the pan gesture has moved far enough to activate.
  const tap = Gesture.Tap().onEnd(() => {
    if (onPressCard) runOnJS(onPressCard)(current);
  });
  const gesture = Gesture.Race(tap, pan);

  const topCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${translateY.value / 20}deg` }],
  }));

  if (!current) {
    return <EmptyState title="That's every trail" body="Check Saved for what you kept." />;
  }

  return (
    <View style={styles.stack}>
      {next ? (
        <View style={[styles.card, styles.behind]}>
          <TrailCard trail={next} />
        </View>
      ) : null}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, topCardStyle]}>
          <TrailCard trail={current} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { flex: 1, justifyContent: 'center' },
  card: { position: 'absolute', width: '100%' },
  behind: { transform: [{ scale: 0.96 }], opacity: 0.6, top: 12 },
});
