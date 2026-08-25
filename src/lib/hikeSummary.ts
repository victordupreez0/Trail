// Pure helpers for the hike summary screen (app/hike/summary.tsx), kept free of any
// firebase import so they stay unit testable under jest-expo (same split as
// party.ts, hydration.ts, wave.ts).

// No coordinate-to-pixel projection exists anywhere else in the app: every map today
// is a real react-native-maps Polyline, which consumes lat/lng natively. This is the
// first (and only) place a geo path gets drawn as raw SVG.
export function projectPath(
  path: { latitude: number; longitude: number }[],
  width: number,
  height: number,
  padding = 12,
): { x: number; y: number }[] {
  if (path.length === 0) return [];
  const lats = path.map((p) => p.latitude);
  const lngs = path.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  // A single-point path (or one that's a straight line of longitude/latitude) would
  // otherwise divide by zero; falling back to 1 just centres it in the box.
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  return path.map((p) => ({
    x: padding + ((p.longitude - minLng) / lngRange) * innerW,
    // Flipped: latitude increases north, SVG y increases down the screen.
    y: padding + (1 - (p.latitude - minLat) / latRange) * innerH,
  }));
}

// Every trail.path is a simplified 3-4 point polyline (see src/data/trails.ts), and
// every map screen in the app already draws that same path as straight segments via
// Polyline - so straight segments here is consistency with the rest of the app, not
// a corner cut.
export function pathToSvgD(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');
}

// The draw-on animation needs a real total to count strokeDashoffset down from.
export function pathLength(points: { x: number; y: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
