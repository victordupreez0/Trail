import { distanceToTrailhead, formatDistance, withTimeout } from '../src/lib/trailhead';

describe('withTimeout', () => {
  it('returns the value when the promise is quick enough', async () => {
    await expect(withTimeout(Promise.resolve('fix'), 1000)).resolves.toBe('fix');
  });

  it('gives up with null when the promise takes too long', async () => {
    const never = new Promise<string>(() => {});
    await expect(withTimeout(never, 1)).resolves.toBeNull();
  });

  it('passes a failure straight through', async () => {
    await expect(withTimeout(Promise.reject(new Error('off')), 1000)).rejects.toThrow('off');
  });
});

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
