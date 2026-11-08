import { Redirect, Stack } from 'expo-router';

import { useAppState } from '../../src/state/AppState';

// Reacts to the signed-in state instead of each form navigating after its await, so
// the next screen is only chosen once Firebase has actually reported the new user.
export default function AuthLayout() {
  const { isAuthed, hasOnboarded, onboardingReady } = useAppState();
  if (isAuthed && onboardingReady) {
    return <Redirect href={hasOnboarded ? '/(app)' : '/onboarding'} />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
