import { distanceToTrailhead, formatDistance } from '../src/lib/trailhead';

describe('trailhead proximity', () => {
  it('measures distance between coordinates', () => {
    const distance = distanceToTrailhead(
      { latitude: -33.9395, longitude: 18.3838 },
      { latitude: -33.9359, longitude: 18.3875 },
    );

    expect(distance).toBeGreaterThan(500);
    expect(distance).toBeLessThan(600);
  });

  it('formats nearby and longer distances', () => {
    expect(formatDistance(420)).toBe('420 m');
    expect(formatDistance(12_340)).toBe('12.3 km');
  });
});
