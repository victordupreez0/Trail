// Pure party-list helpers, kept free of any firebase import so they stay unit
// testable under jest-expo (same constraint that split authMessage.ts out of
// auth.ts and inviteCode.ts out of groups.ts).
import { memberPalette } from '../theme/colors';

const STALE_MS = 90_000;

// Every device needs to colour the same person identically with no coordination and
// no extra Firestore write, so the colour is derived from the uid rather than stored.
export function memberColor(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) | 0;
  return memberPalette[Math.abs(hash) % memberPalette.length];
}

export function initialsOf(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Splits a breadcrumb trail into a handful of overlapping segments (sharing one
// point at each boundary, so the segments still connect visually) for a fading
// multi-Polyline trail. react-native-maps' Polyline has no per-vertex gradient, so
// this is the coarse-grained way to fake one.
export function breadcrumbSegments<T>(points: T[], segmentCount = 3): T[][] {
  if (points.length < 2) return [];
  const chunkSize = Math.max(2, Math.ceil(points.length / segmentCount));
  const segments: T[][] = [];
  for (let i = 0; i + 1 < points.length; i += chunkSize - 1) {
    const chunk = points.slice(i, i + chunkSize);
    if (chunk.length >= 2) segments.push(chunk);
  }
  return segments;
}

// The one throttle rule shared by useLiveLocation's watcher (10s) and its heartbeat
// (30s): a null lastWriteMs means nothing has been written yet, so it's always due.
export function dueForWrite(lastWriteMs: number | null, nowMs: number, minGapMs: number): boolean {
  return lastWriteMs === null || nowMs - lastWriteMs >= minGapMs;
}

// null covers the writer's own optimistic snapshot of a serverTimestamp() write,
// which reads back as null until the server round-trips it. That's a fresh write in
// progress, not an absent one, so it must not read as stale.
export function lastSeenLabel(updatedAtMs: number | null, nowMs: number): string | null {
  if (updatedAtMs === null) return null;
  const ageMs = nowMs - updatedAtMs;
  if (ageMs < STALE_MS) return null;
  const minutes = Math.max(1, Math.round(ageMs / 60_000));
  return `last seen ${minutes}m ago`;
}
