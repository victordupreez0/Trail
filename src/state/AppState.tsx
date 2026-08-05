import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

// In-memory only, with no persistence. Every reload replays onboarding, auth, then app,
// which is useful for a live demo. Gets replaced by real Firebase Auth + Firestore
// listeners once the backend lands; the screens consuming this context don't change.
type AppStateValue = {
  hasOnboarded: boolean;
  completeOnboarding: () => void;
  isAuthed: boolean;
  login: () => void;
  logout: () => void;
  savedTrailIds: string[];
  isSaved: (trailId: string) => boolean;
  toggleSaved: (trailId: string) => void;
  activeGroupId: string | null;
  setActiveGroupId: (groupId: string | null) => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [savedTrailIds, setSavedTrailIds] = useState<string[]>(['lions-head', 'pipe-track']);
  const [activeGroupId, setActiveGroupId] = useState<string | null>('group-1');

  const value = useMemo<AppStateValue>(
    () => ({
      hasOnboarded,
      completeOnboarding: () => setHasOnboarded(true),
      isAuthed,
      login: () => setIsAuthed(true),
      logout: () => setIsAuthed(false),
      savedTrailIds,
      isSaved: (trailId) => savedTrailIds.includes(trailId),
      toggleSaved: (trailId) =>
        setSavedTrailIds((ids) =>
          ids.includes(trailId) ? ids.filter((id) => id !== trailId) : [...ids, trailId],
        ),
      activeGroupId,
      setActiveGroupId,
    }),
    [hasOnboarded, isAuthed, savedTrailIds, activeGroupId],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
