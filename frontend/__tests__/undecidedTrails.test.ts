import { undecidedTrails } from '../src/lib/swipe';

const trails = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

test('the deck starts with every unsaved trail', () => {
  expect(undecidedTrails(trails, ['b'], new Set())).toEqual([
    { id: 'a' },
    { id: 'c' },
    { id: 'd' },
  ]);
});

test('saving the top card makes the very next trail the top card', () => {
  const deck = undecidedTrails(trails, ['a'], new Set(['a']));
  expect(deck[0]).toEqual({ id: 'b' });
});

test('swiping through the deck shows every trail exactly once', () => {
  const seen: string[] = [];
  const saved: string[] = [];
  const decided = new Set<string>();
  let deck = undecidedTrails(trails, saved, decided);
  while (deck.length) {
    seen.push(deck[0].id);
    // Saves every other card, the mix that used to skip trails.
    if (seen.length % 2) saved.push(deck[0].id);
    decided.add(deck[0].id);
    deck = undecidedTrails(trails, saved, decided);
  }
  expect(seen).toEqual(['a', 'b', 'c', 'd']);
});

test('a card leaves as soon as it is decided, before the save comes back', () => {
  expect(undecidedTrails(trails, [], new Set(['a']))[0]).toEqual({ id: 'b' });
});

test('starting over brings back skipped trails but not saved ones', () => {
  expect(undecidedTrails(trails, ['a'], new Set())).toEqual([
    { id: 'b' },
    { id: 'c' },
    { id: 'd' },
  ]);
});
