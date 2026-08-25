import { fillRatio, todayKey, waterToday } from '../src/lib/hydration';

test('todayKey formats a local date as YYYY-MM-DD', () => {
  expect(todayKey(new Date(2026, 7, 25))).toBe('2026-08-25');
  expect(todayKey(new Date(2026, 0, 3))).toBe('2026-01-03');
});

test("yesterday's total reads back as zero", () => {
  expect(waterToday(1500, '2026-08-24', '2026-08-25')).toBe(0);
});

test("today's total reads through unchanged", () => {
  expect(waterToday(1500, '2026-08-25', '2026-08-25')).toBe(1500);
});

test('a null waterDate (never logged) reads as zero', () => {
  expect(waterToday(0, null, '2026-08-25')).toBe(0);
});

test('fillRatio clamps between 0 and 1', () => {
  expect(fillRatio(0, 2000)).toBe(0);
  expect(fillRatio(1000, 2000)).toBe(0.5);
  expect(fillRatio(3000, 2000)).toBe(1);
});

test('fillRatio treats a zero or negative goal as zero rather than dividing by it', () => {
  expect(fillRatio(500, 0)).toBe(0);
  expect(fillRatio(500, -100)).toBe(0);
});
