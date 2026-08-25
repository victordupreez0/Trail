import {
  breadcrumbSegments,
  dueForWrite,
  hexWithAlpha,
  initialsOf,
  lastSeenLabel,
  memberColor,
} from '../src/lib/party';

test('a null last write is always due', () => {
  expect(dueForWrite(null, Date.now(), 10_000)).toBe(true);
});

test('a write inside the gap is not due', () => {
  const now = Date.now();
  expect(dueForWrite(now - 5_000, now, 10_000)).toBe(false);
});

test('a write at or past the gap is due', () => {
  const now = Date.now();
  expect(dueForWrite(now - 10_000, now, 10_000)).toBe(true);
  expect(dueForWrite(now - 30_000, now, 10_000)).toBe(true);
});

test('a fresh update reads as not stale', () => {
  const now = Date.now();
  expect(lastSeenLabel(now - 89_000, now)).toBeNull();
});

test('an update past 90s reads a last-seen label', () => {
  const now = Date.now();
  expect(lastSeenLabel(now - 91_000, now)).toBe('last seen 2m ago');
});

test("a null updatedAt (the writer's own optimistic snapshot) reads as fresh", () => {
  expect(lastSeenLabel(null, Date.now())).toBeNull();
});

test('a uid maps to the same colour every time', () => {
  const uid = 'sim-sam';
  expect(memberColor(uid)).toBe(memberColor(uid));
});

test('initials are capped at two characters and uppercased', () => {
  expect(initialsOf('nadia')).toBe('NA');
  expect(initialsOf('  Sam  ')).toBe('SA');
});

test('hexWithAlpha converts a hex colour to an rgba string', () => {
  expect(hexWithAlpha('#2F6B4F', 0.5)).toBe('rgba(47, 107, 79, 0.5)');
});

test('fewer than two points produces no breadcrumb segments', () => {
  expect(breadcrumbSegments([])).toEqual([]);
  expect(breadcrumbSegments([{ x: 1 }])).toEqual([]);
});

test('breadcrumb segments overlap at their boundaries so they stay connected', () => {
  const points = [0, 1, 2, 3, 4, 5, 6].map((n) => ({ n }));
  const segments = breadcrumbSegments(points, 3);
  expect(segments.length).toBeGreaterThan(1);
  for (let i = 1; i < segments.length; i++) {
    expect(segments[i][0]).toEqual(segments[i - 1][segments[i - 1].length - 1]);
  }
});
