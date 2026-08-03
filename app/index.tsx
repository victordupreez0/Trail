import { Redirect } from 'expo-router';

import { useAppState } from '../src/state/AppState';

export default function Index() {
  const { hasOnboarded, isAuthed } = useAppState();

  if (!hasOnboarded) return <Redirect href="/onboarding" />;
  if (!isAuthed) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(app)" />;
}
