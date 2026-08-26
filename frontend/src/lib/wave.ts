// A static, tileable sine-wave path for the hydration bottle's two wave layers.
// The whole point of drawing it as whole periods is that HydrationBottle animates
// translateX only (never the `d` prop, which is fragile off the UI thread in
// Reanimated 4), so the shape has to repeat seamlessly against a copy of itself
// shifted by exactly one period width.
const STEPS = 48;

// Exported separately from sineWavePath so the tiling property is unit testable
// without parsing an SVG path string back apart.
export function wavePoints(
  width: number,
  amplitude: number,
  periods: number,
): { x: number; y: number }[] {
  const midline = amplitude; // keeps the whole wave within [0, 2 * amplitude]
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const x = (i / STEPS) * width;
    const y = midline - amplitude * Math.sin((2 * Math.PI * periods * i) / STEPS);
    points.push({ x, y });
  }
  return points;
}

// A filled shape: the sine crest across `width`, then closed down to `height` and
// back to the origin.
export function sineWavePath(
  width: number,
  height: number,
  amplitude: number,
  periods = 2,
): string {
  const points = wavePoints(width, amplitude, periods);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  d.push(`L ${width.toFixed(2)},${height.toFixed(2)}`, `L 0,${height.toFixed(2)}`, 'Z');
  return d.join(' ');
}
