import { formatDuration, pathLength, pathToSvgD, projectPath } from '../src/lib/hikeSummary';

test('increasing latitude produces decreasing y, so north stays up on screen', () => {
  const points = projectPath(
    [
      { latitude: -33.9, longitude: 18.4 },
      { latitude: -33.8, longitude: 18.5 },
    ],
    100,
    100,
    0,
  );
  expect(points[1].y).toBeLessThan(points[0].y);
});

test('projected points stay within the padded box', () => {
  const points = projectPath(
    [
      { latitude: -33.9, longitude: 18.4 },
      { latitude: -33.8, longitude: 18.5 },
      { latitude: -33.85, longitude: 18.45 },
    ],
    120,
    80,
    10,
  );
  for (const p of points) {
    expect(p.x).toBeGreaterThanOrEqual(10);
    expect(p.x).toBeLessThanOrEqual(110);
    expect(p.y).toBeGreaterThanOrEqual(10);
    expect(p.y).toBeLessThanOrEqual(70);
  }
});

test('a single-point path does not divide by zero', () => {
  const points = projectPath([{ latitude: -33.9, longitude: 18.4 }], 100, 100, 10);
  expect(points).toHaveLength(1);
  expect(Number.isFinite(points[0].x)).toBe(true);
  expect(Number.isFinite(points[0].y)).toBe(true);
});

test('pathToSvgD draws one M then straight L segments', () => {
  const d = pathToSvgD([
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ]);
  expect(d).toBe('M 0.00,0.00 L 10.00,0.00 L 10.00,10.00');
});

test('pathLength sums a right-angle path exactly', () => {
  const len = pathLength([
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 4 },
  ]);
  expect(len).toBeCloseTo(7, 5);
});

test('formatDuration formats minutes under an hour and hours plus minutes over one', () => {
  expect(formatDuration(0)).toBe('0m');
  expect(formatDuration(41 * 60_000)).toBe('41m');
  expect(formatDuration((2 * 60 + 14) * 60_000)).toBe('2h 14m');
});
