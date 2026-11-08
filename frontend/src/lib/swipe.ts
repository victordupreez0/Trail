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

// The deck is whatever is left, always read from the front. Tracking trails by id
// rather than a position index means a saved trail leaving the list can't shift the
// next one out from under the deck.
export function undecidedTrails<T extends { id: string }>(
  trails: T[],
  savedIds: string[],
  decidedIds: ReadonlySet<string>,
): T[] {
  return trails.filter((t) => !savedIds.includes(t.id) && !decidedIds.has(t.id));
}
