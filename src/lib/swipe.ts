export type SwipeDecision = 'save' | 'skip';

const SWIPE_THRESHOLD = 120;

// Pure and dependency-free on purpose: SwipeDeck.tsx imports react-native-reanimated,
// which needs a native module Jest can't load in a plain unit test. Keeping the
// decision logic here (no reanimated/gesture-handler import) keeps it testable.
export function decideSwipe(dy: number): SwipeDecision | null {
  if (dy <= -SWIPE_THRESHOLD) return 'save';
  if (dy >= SWIPE_THRESHOLD) return 'skip';
  return null;
}
