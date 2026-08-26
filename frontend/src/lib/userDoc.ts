import {
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from './firebase';
import { todayKey } from './hydration';
import type { UserDoc } from '../types/models';

const DEFAULT_HYDRATION_GOAL_ML = 2000;
const DEFAULT_WATER_INTERVAL_MIN = 30;
const DEFAULT_REST_INTERVAL_MIN = 90;

// Nothing has ever created users/{uid}; auth alone doesn't touch Firestore. Called
// once per sign-in from AppState; a plain existence check rather than setDoc-with-
// merge, because merge would silently reset waterMl to 0 on every returning login.
export async function ensureUserDoc(
  uid: string,
  displayName: string,
  email: string,
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    displayName,
    email,
    photoURL: null,
    hydrationGoalMl: DEFAULT_HYDRATION_GOAL_ML,
    waterMl: 0,
    waterDate: todayKey(),
    remindersEnabled: true,
    waterIntervalMin: DEFAULT_WATER_INTERVAL_MIN,
    restIntervalMin: DEFAULT_REST_INTERVAL_MIN,
    activeGroupId: null,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToUserDoc(uid: string, cb: (doc: UserDoc | null) => void): Unsubscribe {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => cb(snap.exists() ? (snap.data() as UserDoc) : null),
    (err) => console.warn('subscribeToUserDoc failed', err),
  );
}

// A Firestore increment rather than a read-modify-write, so rapid taps on the
// dashboard's log-water control can't race each other and drop a count. sameDay
// comes from the caller (AppState knows the live userDoc), because a plain
// increment can never notice a day has rolled over on its own; a rollover instead
// gets a fresh total and today's date.
export async function logWater(uid: string, ml: number, sameDay: boolean): Promise<void> {
  await updateDoc(
    doc(db, 'users', uid),
    sameDay ? { waterMl: increment(ml) } : { waterMl: ml, waterDate: todayKey() },
  );
}

export async function setHydrationGoal(uid: string, ml: number): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { hydrationGoalMl: ml });
}

export async function setReminderSettings(
  uid: string,
  patch: Partial<Pick<UserDoc, 'remindersEnabled' | 'waterIntervalMin' | 'restIntervalMin'>>,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), patch);
}
