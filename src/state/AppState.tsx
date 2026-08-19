import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { signIn, signOutNow, signUp } from '../lib/auth';
import { auth } from '../lib/firebase';

// Auth is real (Firebase, session-persisted to AsyncStorage automatically by the SDK).
// Saved trails and the active group are still in-memory stand-ins, replaced by
// Firestore listeners once Slice 2/3 lands; the screens consuming this context don't
// change when that happens.
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
  const [savedTrailIds, setSavedTrailIds] = useState<string[]>(['lions-head', 'pipe-track']);
  const [activeGroupId, setActiveGroupId] = useState<string | null>('group-1');

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

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
      toggleSaved: (trailId) =>
        setSavedTrailIds((ids) =>
          ids.includes(trailId) ? ids.filter((id) => id !== trailId) : [...ids, trailId],
        ),
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
