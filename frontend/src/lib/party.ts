// Pure party-list helpers, kept free of any firebase import so they stay unit
// testable under jest-expo (same constraint that split authMessage.ts out of
// auth.ts and inviteCode.ts out of groups.ts).
import { memberPalette } from '../theme/colors';

type Coordinate = { latitude: number; longitude: number };
type Region = Coordinate & { latitudeDelta: number; longitudeDelta: number };

// The one definition of "has gone quiet", shared by the dimmed marker, the "last
// seen" label and the alert so they can never disagree. Four missed 30s heartbeats.
const STALE_MS = 120_000;
const LOW_BATTERY = 0.15;

// How often screens re-check staleness. Nothing else re-renders them when a member
// simply stops sending updates, so a clock has to.
export const PARTY_TICK_MS = 10_000;

// Roughly 650m of latitude, so one hiker (or two standing together) doesn't zoom
// the map to street-corner level.
const MIN_FRAME_DELTA = 0.006;
// Extra room around the party, so ordinary walking doesn't trigger a reframe.
const FRAME_PADDING = 1.8;
// Reframe a little before anyone actually reaches the edge of the map.
const FRAME_EDGE = 0.85;

// Every device needs to colour the same person identically with no coordination and
// no extra Firestore write, so the colour is derived from the uid rather than stored.
export function memberColor(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) | 0;
  return memberPalette[Math.abs(hash) % memberPalette.length];
}

// One answer everywhere. Accounts created before names were collected, like the demo
// admin, fall back to the start of their email.
export function displayNameOf(user: { displayName: string | null; email: string | null } | null) {
  return user?.displayName || user?.email?.split('@')[0] || 'Hiker';
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
  return `last seen ${minutesOf(ageMs)}m ago`;
}

function minutesOf(ageMs: number): number {
  return Math.max(1, Math.round(ageMs / 60_000));
}

export type PartyAlert = { key: string; severity: 'danger' | 'warning'; text: string };

type AlertablePosition = {
  displayName: string;
  batteryLevel: number;
  updatedAt: { toMillis: () => number } | null;
};

// Your own position is skipped: nobody needs telling that they've gone quiet.
export function partyAlerts(
  positions: Record<string, AlertablePosition>,
  selfUid: string,
  nowMs: number,
): PartyAlert[] {
  const alerts: PartyAlert[] = [];
  for (const [uid, pos] of Object.entries(positions)) {
    if (uid === selfUid) continue;
    const ageMs = pos.updatedAt ? nowMs - pos.updatedAt.toMillis() : 0;
    if (ageMs >= STALE_MS) {
      alerts.push({
        key: `stale-${uid}`,
        severity: 'warning',
        text: `${pos.displayName} hasn't checked in for ${minutesOf(ageMs)} minutes`,
      });
    }
    if (pos.batteryLevel < LOW_BATTERY) {
      alerts.push({
        key: `battery-${uid}`,
        severity: 'danger',
        text: `${pos.displayName}'s battery is at ${Math.round(pos.batteryLevel * 100)}%`,
      });
    }
  }
  return alerts;
}

export function lerpCoordinate(from: Coordinate, to: Coordinate, t: number): Coordinate {
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * t,
    longitude: from.longitude + (to.longitude - from.longitude) * t,
  };
}

// The map region that holds the whole party with room to spare.
export function partyFrame(coordinates: Coordinate[]): Region {
  const lats = coordinates.map((c) => c.latitude);
  const lngs = coordinates.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(MIN_FRAME_DELTA, (maxLat - minLat) * FRAME_PADDING),
    longitudeDelta: Math.max(MIN_FRAME_DELTA, (maxLng - minLng) * FRAME_PADDING),
  };
}

export function insideFrame(coordinate: Coordinate, frame: Region): boolean {
  return (
    Math.abs(coordinate.latitude - frame.latitude) <= (frame.latitudeDelta / 2) * FRAME_EDGE &&
    Math.abs(coordinate.longitude - frame.longitude) <= (frame.longitudeDelta / 2) * FRAME_EDGE
  );
}
