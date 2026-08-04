export type SwipeDecision = 'save' | 'skip';

export const SWIPE_THRESHOLD = 110;

// The 'worklet' directive is what makes this callable from a gesture handler:
// gesture-handler runs .onEnd on the UI thread, and calling a plain JS function
// from there crashes ("tried to synchronously call a non-worklet function").
// In plain Node the directive is an inert string, so this stays unit testable.
export function decideSwipe(dy: number): SwipeDecision | null {
  'worklet';
  if (dy <= -SWIPE_THRESHOLD) return 'save';
  if (dy >= SWIPE_THRESHOLD) return 'skip';
  return null;
}
