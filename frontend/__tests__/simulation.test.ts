import { densify, isQuiet, routeForHost, routeLengthMetres, walk } from '../src/lib/simulation';
import { distanceToTrailhead } from '../src/lib/trailhead';

const path = [
  { latitude: -33.9395, longitude: 18.3838 },
  { latitude: -33.937, longitude: 18.386 },
  { latitude: -33.9359, longitude: 18.3875 },
];

test('a densified route keeps its end points and evens out the steps', () => {
  const points = densify(path, 50);
  expect(points).toHaveLength(50);
  expect(points[0]).toEqual(path[0]);
  expect(points[49].latitude).toBeCloseTo(path[2].latitude, 6);
  expect(points[49].longitude).toBeCloseTo(path[2].longitude, 6);

  const expectedStep = routeLengthMetres(path) / 49;
  for (let i = 1; i < points.length; i++) {
    expect(distanceToTrailhead(points[i - 1], points[i])).toBeLessThan(expectedStep * 1.5);
  }
});

test('a host at the trail keeps the real route', () => {
  expect(routeForHost(path, path[0])).toBe(path);
});

test('with no host position yet the real route is kept', () => {
  expect(routeForHost(path, null)).toBe(path);
});

test('a host far from the trail gets the same route starting where they are', () => {
  const host = { latitude: -25.75, longitude: 28.23 };
  const route = routeForHost(path, host);
  expect(route[0]).toEqual(host);
  // Not exact: a degree of longitude covers more ground closer to the equator.
  const ratio = routeLengthMetres(route) / routeLengthMetres(path);
  expect(ratio).toBeGreaterThan(0.9);
  expect(ratio).toBeLessThan(1.1);
});

test('walking moves along the route by the given rate', () => {
  expect(walk(5, 1, 0.5, 10)).toEqual({ index: 5.5, direction: 1 });
  expect(walk(5, -1, 0.5, 10)).toEqual({ index: 4.5, direction: -1 });
});

test('walking turns around cleanly at each end of the route', () => {
  expect(walk(9.9, 1, 1, 10)).toEqual({ index: 10, direction: -1 });
  expect(walk(0.1, -1, 1, 10)).toEqual({ index: 0, direction: 1 });
});

test('a hiker is only quiet inside the quiet window', () => {
  expect(isQuiet(29_999, 30_000, 180_000)).toBe(false);
  expect(isQuiet(30_000, 30_000, 180_000)).toBe(true);
  expect(isQuiet(209_999, 30_000, 180_000)).toBe(true);
  expect(isQuiet(210_000, 30_000, 180_000)).toBe(false);
});
