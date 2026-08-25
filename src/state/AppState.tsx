import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { signIn, signOutNow, signUp } from '../lib/auth';
import { auth, db } from '../lib/firebase';
import {
  createGroup as createGroupDoc,
  endGroup,
  findGroupByInviteCode,
  joinGroup,
  subscribeToActiveGroupForUser,
} from '../lib/groups';
import { subscribeToPositions } from '../lib/positions';
import { cancelHikeReminders, scheduleHikeReminders } from '../lib/reminders';
import {
  saveTrail,
  unsaveTrail,
  updateSavedTrailNote as updateSavedTrailNoteDoc,
} from '../lib/savedTrails';
import { todayKey } from '../lib/hydration';
import {
  ensureUserDoc,
  logWater as logWaterDoc,
  setHydrationGoal as setHydrationGoalDoc,
  setReminderSettings as setReminderSettingsDoc,
  subscribeToUserDoc,
} from '../lib/userDoc';
import type { Group, PartyPosition, SavedTrail, UserDoc } from '../types/models';

const ONBOARDED_KEY = 'trail.hasOnboarded';

// Auth, saved trails, the group layer, and the user profile doc are all real
// (Firebase). The screens consuming this context don't change when the last mock
// leaves.
type AppStateValue = {
  hasOnboarded: boolean;
  onboardingReady: boolean;
  completeOnboarding: () => void;
  authReady: boolean;
  user: User | null;
  isAuthed: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  savedTrailIds: string[];
  savedTrailMeta: Record<string, SavedTrail>;
  savedTrailsLoading: boolean;
  isSaved: (trailId: string) => boolean;
  toggleSaved: (trailId: string) => void;
  updateSavedTrailNote: (trailId: string, note: string) => Promise<void>;
  userDoc: UserDoc | null;
  userDocLoading: boolean;
  logWater: (ml: number) => Promise<void>;
  setHydrationGoal: (ml: number) => Promise<void>;
  setReminderSettings: (
    patch: Partial<Pick<UserDoc, 'remindersEnabled' | 'waterIntervalMin' | 'restIntervalMin'>>,
  ) => Promise<void>;
  activeGroup: Group | null;
  partyPositions: Record<string, PartyPosition>;
  groupLoading: boolean;
  createGroup: (name: string, trailId: string) => Promise<Group>;
  joinByCode: (code: string) => Promise<void>;
  endHike: () => Promise<void>;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [savedTrailIds, setSavedTrailIds] = useState<string[]>([]);
  const [savedTrailMeta, setSavedTrailMeta] = useState<Record<string, SavedTrail>>({});
  const [savedTrailsLoading, setSavedTrailsLoading] = useState(false);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [userDocLoading, setUserDocLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [partyPositions, setPartyPositions] = useState<Record<string, PartyPosition>>({});

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      // Fire-and-forget: nothing in the sign-in flow itself creates users/{uid}, so
      // this backfills it for both a brand new account and anyone who signed up
      // before this doc existed. Idempotent, so running it every cold start is fine.
      if (u) {
        ensureUserDoc(u.uid, u.displayName ?? '', u.email ?? '').catch((err) =>
          console.warn('ensureUserDoc failed', err),
        );
      }
    });
  }, []);

  // Read once at cold start. Without this the carousel replays every launch, since
  // hasOnboarded otherwise starts false every time the app process starts fresh.
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((v) => setHasOnboarded(v === 'true'))
      .catch((err) => console.warn('reading onboarding flag failed', err))
      .finally(() => setOnboardingReady(true));
  }, []);

  // Live-syncs saved trails to Firestore. Cleared on sign-out so switching accounts
  // can't leak one user's saves into another's. savedTrailsLoading exists so
  // SavedScreen's empty state doesn't flash before the first snapshot arrives -
  // savedTrailIds starts at [] regardless of whether anything is actually saved.
  useEffect(() => {
    if (!user) {
      setSavedTrailIds([]);
      setSavedTrailMeta({});
      setSavedTrailsLoading(false);
      return;
    }
    setSavedTrailsLoading(true);
    const ref = collection(db, 'users', user.uid, 'savedTrails');
    return onSnapshot(
      ref,
      (snap) => {
        setSavedTrailIds(snap.docs.map((d) => d.id));
        const meta: Record<string, SavedTrail> = {};
        for (const d of snap.docs) {
          const data = d.data();
          meta[d.id] = { savedAt: data.savedAt ?? null, notes: data.notes ?? '' };
        }
        setSavedTrailMeta(meta);
        setSavedTrailsLoading(false);
      },
      (err) => {
        console.warn('savedTrails listener failed', err);
        setSavedTrailsLoading(false);
      },
    );
  }, [user]);

  // Live-syncs the user's own profile doc (hydration, reminders, avatar). Cleared on
  // sign-out for the same reason the saved-trails listener is.
  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      setUserDocLoading(false);
      return;
    }
    setUserDocLoading(true);
    return subscribeToUserDoc(user.uid, (u) => {
      setUserDoc(u);
      setUserDocLoading(false);
    });
  }, [user]);

  // The active group is whichever one the signed-in user is a member of and is
  // still active; self-discovering, so creating or joining one surfaces it here
  // with no separate pointer to keep in sync.
  useEffect(() => {
    if (!user) {
      setActiveGroup(null);
      setGroupLoading(false);
      return;
    }
    setGroupLoading(true);
    return subscribeToActiveGroupForUser(user.uid, (group) => {
      setActiveGroup(group);
      setGroupLoading(false);
    });
  }, [user]);

  // Keyed on the group id rather than the group object, so a snapshot that only
  // changes memberIds or active doesn't tear down and rebuild the positions listener.
  const activeGroupDocId = activeGroup?.id ?? null;
  useEffect(() => {
    if (!activeGroupDocId) {
      setPartyPositions({});
      return;
    }
    return subscribeToPositions(activeGroupDocId, setPartyPositions);
  }, [activeGroupDocId]);

  // Lives here rather than in a screen, so reminders survive navigation between the
  // pager's tabs. Keyed on whether a hike is active and on the reminder settings
  // themselves, so toggling the setting or changing an interval mid-hike reschedules
  // rather than waiting for the next hike to start.
  const hikeActive = activeGroup !== null && activeGroup.active;
  const remindersEnabled = userDoc?.remindersEnabled ?? true;
  const waterIntervalMin = userDoc?.waterIntervalMin ?? 30;
  const restIntervalMin = userDoc?.restIntervalMin ?? 90;
  useEffect(() => {
    if (!hikeActive || !remindersEnabled) {
      cancelHikeReminders().catch((err) => console.warn('cancelHikeReminders failed', err));
      return;
    }
    scheduleHikeReminders(waterIntervalMin, restIntervalMin).catch((err) =>
      console.warn('scheduleHikeReminders failed', err),
    );
    return () => {
      cancelHikeReminders().catch((err) => console.warn('cancelHikeReminders failed', err));
    };
  }, [hikeActive, remindersEnabled, waterIntervalMin, restIntervalMin]);

  const value = useMemo<AppStateValue>(
    () => ({
      hasOnboarded,
      onboardingReady,
      completeOnboarding: () => {
        setHasOnboarded(true);
        AsyncStorage.setItem(ONBOARDED_KEY, 'true').catch((err) =>
          console.warn('persisting onboarding flag failed', err),
        );
      },
      authReady,
      user,
      isAuthed: user !== null,
      signIn: async (email, password) => {
        await signIn(email, password);
      },
      signUp: async (name, email, password) => {
        await signUp(name, email, password);
      },
      logout: () => signOutNow(),
      savedTrailIds,
      savedTrailMeta,
      savedTrailsLoading,
      isSaved: (trailId) => savedTrailIds.includes(trailId),
      toggleSaved: (trailId) => {
        if (!user) return;
        const write = savedTrailIds.includes(trailId)
          ? unsaveTrail(user.uid, trailId)
          : saveTrail(user.uid, trailId);
        // The onSnapshot listener above updates local state; a failed write here
        // means a lost save, so it's worth surfacing, not swallowing.
        write.catch((err) => console.warn('toggleSaved write failed', err));
      },
      updateSavedTrailNote: async (trailId, note) => {
        if (!user) return;
        await updateSavedTrailNoteDoc(user.uid, trailId, note);
      },
      userDoc,
      userDocLoading,
      logWater: async (ml) => {
        if (!user) return;
        const sameDay = userDoc?.waterDate === todayKey();
        await logWaterDoc(user.uid, ml, sameDay);
      },
      setHydrationGoal: async (ml) => {
        if (!user) return;
        await setHydrationGoalDoc(user.uid, ml);
      },
      setReminderSettings: async (patch) => {
        if (!user) return;
        await setReminderSettingsDoc(user.uid, patch);
      },
      activeGroup,
      partyPositions,
      groupLoading,
      createGroup: (name, trailId) => {
        if (!user) return Promise.reject(new Error('Sign in to start a hike.'));
        return createGroupDoc(user.uid, name, trailId);
      },
      joinByCode: async (code) => {
        if (!user) throw new Error('Sign in to join a hike.');
        const groupId = await findGroupByInviteCode(code.trim().toUpperCase());
        if (!groupId) throw new Error('No hike found with that code');
        await joinGroup(groupId, user.uid);
      },
      endHike: async () => {
        if (!user || !activeGroup) return;
        if (activeGroup.ownerId !== user.uid) {
          throw new Error('Only the person who started this hike can end it.');
        }
        await endGroup(activeGroup.id, activeGroup.inviteCode);
      },
    }),
    [
      hasOnboarded,
      onboardingReady,
      authReady,
      user,
      savedTrailIds,
      savedTrailMeta,
      savedTrailsLoading,
      userDoc,
      userDocLoading,
      activeGroup,
      partyPositions,
      groupLoading,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
