import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAppState } from '../src/state/AppState';

export default function Index() {
  const { hasOnboarded, onboardingReady, authReady, isAuthed } = useAppState();
  const ready = authReady && onboardingReady;

  // Wait for both the AsyncStorage onboarding read and Firebase's first auth
  // callback before redirecting anywhere, so a returning user doesn't flash through
  // onboarding or the login screen on cold start. The splash screen (held open in
  // app/_layout.tsx) covers this brief wait, then hides once we know where to go.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;
  if (!hasOnboarded) return <Redirect href="/onboarding" />;
  if (!isAuthed) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(app)" />;
}
