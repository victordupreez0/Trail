import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { signIn, signOutNow, signUp } from '../lib/auth';
import { subscribeToCatalog } from '../lib/catalog';
import { auth, db } from '../lib/firebase';
import {
  createGroup as createGroupDoc,
  endGroup,
  findGroupByInviteCode,
  joinGroup,
  subscribeToActiveGroupForUser,
} from '../lib/groups';
import { subscribeToPositions } from '../lib/positions';
import {
  cancelHikeReminders,
  hasPermission,
  requestPermission,
  scheduleHikeReminders,
} from '../lib/reminders';
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
import { trails as bundledTrails, type Trail } from '../data/trails';

const onboardedKey = (uid: string) => `trail.hasOnboarded.${uid}`;
const DEMO_ADMIN_EMAIL = 'admin@gmail.com';
const ALREADY_ON_A_HIKE = "You're already on a hike. End it before starting another.";

// Auth, saved trails, the group layer, and the user profile doc are all real
// (Firebase). The screens consuming this context don't change when the last mock
// leaves.
type AppStateValue = {
  hasOnboarded: boolean;
  onboardingReady: boolean;
  completeOnboarding: () => void;
  replayOnboarding: () => void;
  authReady: boolean;
  user: User | null;
  isAuthed: boolean;
  isAdmin: boolean;
  trails: Trail[];
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  savedTrailIds: string[];
  savedTrailMeta: Record<string, SavedTrail>;
  savedTrailsLoading: boolean;
  isSaved: (trailId: string) => boolean;
  setTrailSaved: (trailId: string, saved: boolean) => Promise<void>;
  updateSavedTrailNote: (trailId: string, note: string) => Promise<void>;
  userDoc: UserDoc | null;
  userDocLoading: boolean;
  logWater: (ml: number) => Promise<void>;
  setHydrationGoal: (ml: number) => Promise<void>;
  setReminderSettings: (
    patch: Partial<Pick<UserDoc, 'remindersEnabled' | 'waterIntervalMin' | 'restIntervalMin'>>,
  ) => Promise<void>;
  remindersBlocked: boolean;
  activeGroup: Group | null;
  groupLoading: boolean;
  createGroup: (name: string, trailId: string) => Promise<Group>;
  joinByCode: (code: string) => Promise<void>;
  endHike: () => Promise<void>;
  // True once a live Firestore listener has failed, so screens can offer a retry
  // instead of waiting forever on a snapshot that is never coming.
  syncFailed: boolean;
  retrySync: () => void;
  // Bumped to ask the pager to show the Party tab; see app/(app)/index.tsx.
  partyTabRequest: number;
  showPartyTab: () => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

// Separate from the main context on purpose. Positions change every few seconds
// during a hike, and only the two screens that show the party should re-render.
const PartyPositionsContext = createContext<Record<string, PartyPosition>>({});

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [onboarding, setOnboarding] = useState<{ uid: string; done: boolean } | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [trails, setTrails] = useState<Trail[]>(bundledTrails);
  const [savedTrailIds, setSavedTrailIds] = useState<string[]>([]);
  const [savedTrailMeta, setSavedTrailMeta] = useState<Record<string, SavedTrail>>({});
  const [savedTrailsLoading, setSavedTrailsLoading] = useState(false);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [userDocLoading, setUserDocLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [partyPositions, setPartyPositions] = useState<Record<string, PartyPosition>>({});
  const [remindersBlocked, setRemindersBlocked] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [syncAttempt, setSyncAttempt] = useState(0);
  const [partyTabRequest, setPartyTabRequest] = useState(0);
  // Firebase updates the name on the existing user object and doesn't announce it, so
  // this is what tells screens to read the new name after sign-up.
  const [profileVersion, setProfileVersion] = useState(0);

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

  // The bundled catalog makes the app usable before the first network response;
  // Firestore replaces it live once the signed-in session is ready.
  useEffect(() => {
    if (!user) {
      setTrails(bundledTrails);
      return;
    }
    return subscribeToCatalog(setTrails, (err) => {
      console.warn('trail catalog listener failed', err);
    });
  }, [user]);

  // Remembered per account, so the intro shows once for each person who signs in on
  // this phone. Keeping the uid alongside the answer means a flag read for one
  // account can never be mistaken for another's while the next read is in flight.
  useEffect(() => {
    if (!user) {
      setOnboarding(null);
      return;
    }
    const uid = user.uid;
    let cancelled = false;
    AsyncStorage.getItem(onboardedKey(uid))
      .then((v) => {
        if (!cancelled) setOnboarding({ uid, done: v === 'true' });
      })
      .catch((err) => {
        console.warn('reading onboarding flag failed', err);
        // A storage failure shouldn't trap anyone on the intro.
        if (!cancelled) setOnboarding({ uid, done: true });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const onboardingReady = user === null || onboarding?.uid === user.uid;
  const hasOnboarded = user !== null && onboarding?.uid === user.uid && onboarding.done;

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
        setSyncFailed(true);
      },
    );
  }, [user, syncAttempt]);

  // Live-syncs the user's own profile doc (hydration, reminders, avatar). Cleared on
  // sign-out for the same reason the saved-trails listener is.
  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      setUserDocLoading(false);
      return;
    }
    setUserDocLoading(true);
    return subscribeToUserDoc(
      user.uid,
      (u) => {
        setUserDoc(u);
        setUserDocLoading(false);
      },
      () => {
        setUserDocLoading(false);
        setSyncFailed(true);
      },
    );
  }, [user, syncAttempt]);

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
    return subscribeToActiveGroupForUser(
      user.uid,
      (group) => {
        setActiveGroup(group);
        setGroupLoading(false);
      },
      () => {
        setGroupLoading(false);
        setSyncFailed(true);
      },
    );
  }, [user, syncAttempt]);

  // Keyed on the group id rather than the group object, so a snapshot that only
  // changes memberIds or active doesn't tear down and rebuild the positions listener.
  const activeGroupDocId = activeGroup?.id ?? null;
  useEffect(() => {
    if (!activeGroupDocId) {
      setPartyPositions({});
      return;
    }
    return subscribeToPositions(activeGroupDocId, setPartyPositions, () => setSyncFailed(true));
  }, [activeGroupDocId, syncAttempt]);

  // Lives here rather than in a screen, so reminders survive navigation between the
  // pager's tabs. Keyed on whether a hike is active and on the reminder settings
  // themselves, so toggling the setting or changing an interval mid-hike reschedules
  // rather than waiting for the next hike to start. No cancel on re-run: scheduling
  // the same identifier replaces the old reminder.
  const hikeActive = activeGroup !== null && activeGroup.active;
  const remindersEnabled = userDoc?.remindersEnabled ?? true;
  const waterIntervalMin = userDoc?.waterIntervalMin ?? 30;
  const restIntervalMin = userDoc?.restIntervalMin ?? 90;
  useEffect(() => {
    if (!hikeActive || !remindersEnabled) {
      setRemindersBlocked(false);
      cancelHikeReminders().catch((err) => console.warn('cancelHikeReminders failed', err));
      return;
    }
    let cancelled = false;
    (async () => {
      const granted = await hasPermission();
      if (cancelled) return;
      setRemindersBlocked(!granted);
      if (granted) await scheduleHikeReminders(waterIntervalMin, restIntervalMin);
    })().catch((err) => console.warn('scheduleHikeReminders failed', err));
    return () => {
      cancelled = true;
    };
  }, [hikeActive, remindersEnabled, waterIntervalMin, restIntervalMin]);

  const value = useMemo<AppStateValue>(() => {
    // Asked just before a hike starts, while the person can see why. Waiting until
    // the first reminder is due would mean it silently never arrives.
    const askForReminders = async () => {
      if (remindersEnabled) await requestPermission().catch(() => false);
    };

    return {
      hasOnboarded,
      onboardingReady,
      completeOnboarding: () => {
        if (!user) return;
        setOnboarding({ uid: user.uid, done: true });
        AsyncStorage.setItem(onboardedKey(user.uid), 'true').catch((err) =>
          console.warn('persisting onboarding flag failed', err),
        );
      },
      replayOnboarding: () => {
        if (!user) return;
        setOnboarding({ uid: user.uid, done: false });
        AsyncStorage.removeItem(onboardedKey(user.uid)).catch((err) =>
          console.warn('clearing onboarding flag failed', err),
        );
      },
      authReady,
      user,
      isAuthed: user !== null,
      isAdmin: user?.email === DEMO_ADMIN_EMAIL,
      trails,
      signIn: async (email, password) => {
        await signIn(email, password);
      },
      signUp: async (name, email, password) => {
        await signUp(name, email, password);
        setProfileVersion((n) => n + 1);
      },
      logout: () => signOutNow(),
      savedTrailIds,
      savedTrailMeta,
      savedTrailsLoading,
      isSaved: (trailId) => savedTrailIds.includes(trailId),
      // The onSnapshot listener above updates local state. Callers handle a
      // rejection, because a failed write here means a lost save.
      setTrailSaved: async (trailId, saved) => {
        if (!user) return;
        await (saved ? saveTrail(user.uid, trailId) : unsaveTrail(user.uid, trailId));
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
      remindersBlocked,
      activeGroup,
      groupLoading,
      createGroup: async (name, trailId) => {
        if (!user) throw new Error('Sign in to start a hike.');
        // Only one active hike is ever shown, so a second would hide the first.
        if (activeGroup) throw new Error(ALREADY_ON_A_HIKE);
        await askForReminders();
        return createGroupDoc(user.uid, name, trailId);
      },
      joinByCode: async (code) => {
        if (!user) throw new Error('Sign in to join a hike.');
        if (activeGroup) throw new Error(ALREADY_ON_A_HIKE);
        const groupId = await findGroupByInviteCode(code.trim().toUpperCase());
        if (!groupId) throw new Error('No hike found with that code');
        await askForReminders();
        await joinGroup(groupId, user.uid);
      },
      endHike: async () => {
        if (!user || !activeGroup) return;
        if (activeGroup.ownerId !== user.uid) {
          throw new Error('Only the person who started this hike can end it.');
        }
        await endGroup(activeGroup.id, activeGroup.inviteCode);
      },
      syncFailed,
      retrySync: () => {
        setSyncFailed(false);
        setSyncAttempt((n) => n + 1);
      },
      partyTabRequest,
      showPartyTab: () => setPartyTabRequest((n) => n + 1),
    };
    // profileVersion isn't read inside, it's here so a name change reaches the screens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasOnboarded,
    onboardingReady,
    authReady,
    user,
    profileVersion,
    trails,
    savedTrailIds,
    savedTrailMeta,
    savedTrailsLoading,
    userDoc,
    userDocLoading,
    remindersEnabled,
    remindersBlocked,
    activeGroup,
    groupLoading,
    syncFailed,
    partyTabRequest,
  ]);

  return (
    <AppStateContext.Provider value={value}>
      <PartyPositionsContext.Provider value={partyPositions}>
        {children}
      </PartyPositionsContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

export function usePartyPositions() {
  return useContext(PartyPositionsContext);
}
