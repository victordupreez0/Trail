import type { Timestamp } from 'firebase/firestore';

// Shared shapes for everything real in Firestore, matching backend/firestore.rules and
// the data-model block in README.md field for field. Positions are plain lat/lng, not
// a Firestore GeoPoint: that's what react-native-maps consumes with no wrapper, and
// what trails.ts already uses for the same kind of coordinate.

export type UserDoc = {
  displayName: string;
  email: string;
  photoURL: string | null;
  hydrationGoalMl: number;
  // Running total for the day, logged in 250ml taps from the dashboard. Not in the
  // original README schema; added here because the brief needs a real counter, and
  // the user doc is the natural home for it (same read/write audience as the goal).
  waterMl: number;
  // The local date (YYYY-MM-DD, see src/lib/hydration.ts) waterMl was last logged on.
  // waterMl itself is a Firestore increment, so nothing resets it server-side; a
  // stale date is how a new day reads the total back as zero.
  waterDate: string | null;
  // Local-notification settings. Also not in the original schema; same reasoning.
  remindersEnabled: boolean;
  waterIntervalMin: number;
  restIntervalMin: number;
  activeGroupId: string | null;
  createdAt: Timestamp | null;
};

export type SavedTrail = {
  savedAt: Timestamp | null;
  notes: string;
};

export type Group = {
  id: string;
  name: string;
  trailId: string;
  ownerId: string;
  memberIds: string[];
  active: boolean;
  inviteCode: string;
  // null on the writer's own optimistic snapshot, before the server round-trips a
  // serverTimestamp() write back down.
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
};

export type PartyPosition = {
  // Denormalised from the writer's own profile: users/{uid} is self-read-only, so a
  // teammate's position doc is the only place another member's client can see their
  // name. Safe to duplicate here since it's already self-write / member-read, the
  // same audience as the position itself.
  displayName: string;
  position: { latitude: number; longitude: number };
  accuracy: number;
  batteryLevel: number;
  moving: boolean;
  updatedAt: Timestamp | null;
};
