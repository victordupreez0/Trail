// Route maths for backend/simulate-hiker.ts, kept here so it can be unit tested.
import { distanceToTrailhead } from './trailhead';

type Point = { latitude: number; longitude: number };

// Beyond this the host's phone and the trail can't share a readable map.
const NEAR_HOST_METRES = 2000;

export function routeLengthMetres(path: Point[]): number {
  return path.slice(1).reduce((sum, p, i) => sum + distanceToTrailhead(path[i], p), 0);
}

// The trail catalog only stores 3-4 corner points, not a walkable track, so this
// interpolates evenly along each segment to get a path a hiker can walk step by
// step without teleporting between corners.
export function densify(path: Point[], count: number): Point[] {
  const segmentLengths = path.slice(1).map((p, i) => distanceToTrailhead(path[i], p));
  const totalLength = segmentLengths.reduce((a, b) => a + b, 0);
  const out: Point[] = [];
  for (let i = 0; i < count; i++) {
    const targetDist = (totalLength * i) / (count - 1);
    let covered = 0;
    let seg = 0;
    while (seg < segmentLengths.length - 1 && covered + segmentLengths[seg] < targetDist) {
      covered += segmentLengths[seg];
      seg++;
    }
    const segLen = segmentLengths[seg] || 1;
    const t = Math.min(1, (targetDist - covered) / segLen);
    const a = path[seg];
    const b = path[seg + 1];
    out.push({
      latitude: a.latitude + (b.latitude - a.latitude) * t,
      longitude: a.longitude + (b.longitude - a.longitude) * t,
    });
  }
  return out;
}

// A demo usually happens nowhere near the trail. Left alone, the map would have to
// fit a phone in one city and simulated hikers in another, zooming out until nobody
// is visible, so the same route shape is moved to start where the host is standing.
export function routeForHost(path: Point[], host: Point | null): Point[] {
  if (!host || distanceToTrailhead(host, path[0]) <= NEAR_HOST_METRES) return path;
  const latitudeShift = host.latitude - path[0].latitude;
  const longitudeShift = host.longitude - path[0].longitude;
  return path.map((p) => ({
    latitude: p.latitude + latitudeShift,
    longitude: p.longitude + longitudeShift,
  }));
}

// Walks back and forth along the route, stopping cleanly at each end.
export function walk(
  index: number,
  direction: 1 | -1,
  rate: number,
  lastIndex: number,
): { index: number; direction: 1 | -1 } {
  const next = index + rate * direction;
  if (next >= lastIndex) return { index: lastIndex, direction: -1 };
  if (next <= 0) return { index: 0, direction: 1 };
  return { index: next, direction };
}

export function isQuiet(elapsedMs: number, quietAfterMs: number, quietForMs: number): boolean {
  return elapsedMs >= quietAfterMs && elapsedMs < quietAfterMs + quietForMs;
}
