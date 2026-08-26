import { sineWavePath, wavePoints } from '../src/lib/wave';

test('a whole-period wave starts and ends at the same crest y, so it tiles seamlessly', () => {
  const points = wavePoints(132, 7, 2);
  expect(points[0].y).toBeCloseTo(points[points.length - 1].y, 5);
});

test('zero amplitude collapses the wave to a flat top edge', () => {
  const points = wavePoints(132, 0, 2);
  for (const p of points) expect(p.y).toBe(0);
});

test('sineWavePath returns a closed SVG path', () => {
  const d = sineWavePath(132, 24, 7, 2);
  expect(d.startsWith('M ')).toBe(true);
  expect(d.endsWith('Z')).toBe(true);
  expect(d).toContain('L 132.00,24.00');
});
