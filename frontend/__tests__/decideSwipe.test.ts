import { decideSwipe } from '../src/lib/swipe';

test('a strong upward drag saves', () => {
  expect(decideSwipe(-150)).toBe('save');
});

test('a strong downward drag skips', () => {
  expect(decideSwipe(150)).toBe('skip');
});

test('a small drag decides nothing (snaps back)', () => {
  expect(decideSwipe(40)).toBeNull();
  expect(decideSwipe(-40)).toBeNull();
});

test('the threshold boundary is inclusive', () => {
  expect(decideSwipe(-120)).toBe('save');
  expect(decideSwipe(120)).toBe('skip');
});
