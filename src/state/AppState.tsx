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

// Auth and saved trails are real (Firebase). Saved trails live at
// users/{uid}/savedTrails/{trailId}, matching backend/firestore.rules; the active group is
// still an in-memory stand-in, replaced by a Firestore listener once Slice 3 lands.
// The screens consuming this context don't change when that happens.
type AppStateValue = {
  hasOnboarded: boolean;
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
  activeGroupId: string | null;
  setActiveGroupId: (groupId: string | null) => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [savedTrailIds, setSavedTrailIds] = useState<string[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>('group-1');

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
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

  const value = useMemo<AppStateValue>(
    () => ({
      hasOnboarded,
      completeOnboarding: () => setHasOnboarded(true),
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
    }),
    [hasOnboarded, authReady, user, savedTrailIds, activeGroupId],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
