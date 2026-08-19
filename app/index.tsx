import { Redirect } from 'expo-router';

import { useAppState } from '../src/state/AppState';

export default function Index() {
  const { hasOnboarded, authReady, isAuthed } = useAppState();

  // Wait for Firebase's first auth callback before redirecting anywhere, so a
  // signed-in user doesn't flash through the login screen on cold start. The splash
  // screen covers this brief wait.
  if (!authReady) return null;
  if (!hasOnboarded) return <Redirect href="/onboarding" />;
  if (!isAuthed) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(app)" />;
}
