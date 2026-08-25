import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
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
import type { Group, PartyPosition } from '../types/models';

const ONBOARDED_KEY = 'trail.hasOnboarded';

// Auth, saved trails, and the group layer are all real (Firebase). The screens
// consuming this context don't change when the last mock leaves.
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
  isSaved: (trailId: string) => boolean;
  toggleSaved: (trailId: string) => void;
  // Legacy mock pointer, kept only so app/group/create.tsx, app/group/join.tsx and
  // app/trail/[id].tsx keep compiling. P2 rewires those screens onto activeGroup /
  // createGroup / joinByCode below and deletes this pair.
  activeGroupId: string | null;
  setActiveGroupId: (groupId: string | null) => void;
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
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [partyPositions, setPartyPositions] = useState<Record<string, PartyPosition>>({});

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
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
  // can't leak one user's saves into another's.
  useEffect(() => {
    if (!user) {
      setSavedTrailIds([]);
      return;
    }
    const ref = collection(db, 'users', user.uid, 'savedTrails');
    return onSnapshot(
      ref,
      (snap) => setSavedTrailIds(snap.docs.map((d) => d.id)),
      (err) => console.warn('savedTrails listener failed', err),
    );
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
      isSaved: (trailId) => savedTrailIds.includes(trailId),
      toggleSaved: (trailId) => {
        if (!user) return;
        const ref = doc(db, 'users', user.uid, 'savedTrails', trailId);
        const write = savedTrailIds.includes(trailId)
          ? deleteDoc(ref)
          : setDoc(ref, { savedAt: serverTimestamp() });
        // The onSnapshot listener above updates local state; a failed write here
        // means a lost save, so it's worth surfacing, not swallowing.
        write.catch((err) => console.warn('toggleSaved write failed', err));
      },
      activeGroupId,
      setActiveGroupId,
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
      activeGroupId,
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
