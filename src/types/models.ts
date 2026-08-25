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
  position: { latitude: number; longitude: number };
  accuracy: number;
  batteryLevel: number;
  moving: boolean;
  updatedAt: Timestamp | null;
};
