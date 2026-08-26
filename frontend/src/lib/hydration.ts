// Pure hydration maths, kept free of any firebase import so it stays unit testable
// under jest-expo (same split as party.ts).

// Local date, not UTC: a hiker logging water at 23:40 and again at 00:10 is
// logging on the same evening, not two different days by a server clock.
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// waterMl is a running total written with a Firestore increment, so nothing ever
// resets it server-side. A stale date reads the total back as 0 instead: cheaper
// than a scheduled job, and correct because there's no server here to run one.
export function waterToday(waterMl: number, waterDate: string | null, today: string): number {
  return waterDate === today ? waterMl : 0;
}

export function fillRatio(waterMl: number, goalMl: number): number {
  if (goalMl <= 0) return 0;
  return Math.min(1, Math.max(0, waterMl / goalMl));
}
