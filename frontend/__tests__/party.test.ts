import {
  breadcrumbSegments,
  dueForWrite,
  hexWithAlpha,
  initialsOf,
  insideFrame,
  lastSeenLabel,
  lerpCoordinate,
  memberColor,
  partyAlerts,
  partyFrame,
} from '../src/lib/party';

const NOW = 1_000_000_000;
const position = (ageMs: number | null, batteryLevel = 0.8, displayName = 'Sam') => ({
  displayName,
  batteryLevel,
  updatedAt: ageMs === null ? null : { toMillis: () => NOW - ageMs },
});

test('no alert before a hiker has been quiet for 2 minutes', () => {
  expect(partyAlerts({ sam: position(119_000) }, 'me', NOW)).toEqual([]);
});

test('the stale alert fires once a hiker has been quiet for 2 minutes', () => {
  expect(partyAlerts({ sam: position(120_000) }, 'me', NOW)).toEqual([
    { key: 'stale-sam', severity: 'warning', text: "Sam hasn't checked in for 2 minutes" },
  ]);
});

test('the alert and the last seen label agree on when someone is stale', () => {
  for (const ageMs of [119_000, 120_000]) {
    const alerted = partyAlerts({ sam: position(ageMs) }, 'me', NOW).length > 0;
    expect(alerted).toBe(lastSeenLabel(NOW - ageMs, NOW) !== null);
  }
});

test('you are never alerted about yourself', () => {
  expect(partyAlerts({ me: position(600_000, 0.05) }, 'me', NOW)).toEqual([]);
});

test('a write still in flight does not count as stale', () => {
  expect(partyAlerts({ sam: position(null) }, 'me', NOW)).toEqual([]);
});

test('low battery raises a danger alert', () => {
  expect(partyAlerts({ sam: position(0, 0.1) }, 'me', NOW)).toEqual([
    { key: 'battery-sam', severity: 'danger', text: "Sam's battery is at 10%" },
  ]);
});

test('lerpCoordinate moves part of the way between two points', () => {
  const from = { latitude: 0, longitude: 10 };
  const to = { latitude: 2, longitude: 20 };
  expect(lerpCoordinate(from, to, 0)).toEqual(from);
  expect(lerpCoordinate(from, to, 1)).toEqual(to);
  expect(lerpCoordinate(from, to, 0.5)).toEqual({ latitude: 1, longitude: 15 });
});

test('a lone hiker gets a sensible minimum zoom, not street level', () => {
  const frame = partyFrame([{ latitude: -33.9, longitude: 18.4 }]);
  expect(frame.latitude).toBe(-33.9);
  expect(frame.latitudeDelta).toBeGreaterThan(0.005);
  expect(frame.longitudeDelta).toBeGreaterThan(0.005);
});

test('the frame holds everyone in the party', () => {
  const party = [
    { latitude: -33.9, longitude: 18.4 },
    { latitude: -33.95, longitude: 18.45 },
  ];
  const frame = partyFrame(party);
  for (const member of party) expect(insideFrame(member, frame)).toBe(true);
});

test('someone walking out of the frame is detected', () => {
  const frame = partyFrame([{ latitude: 0, longitude: 0 }]);
  expect(insideFrame({ latitude: frame.latitudeDelta, longitude: 0 }, frame)).toBe(false);
  expect(insideFrame({ latitude: 0, longitude: frame.longitudeDelta }, frame)).toBe(false);
});

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
  expect(lastSeenLabel(now - 119_000, now)).toBeNull();
});

test('an update past 2 minutes reads a last-seen label', () => {
  const now = Date.now();
  expect(lastSeenLabel(now - 121_000, now)).toBe('last seen 2m ago');
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
