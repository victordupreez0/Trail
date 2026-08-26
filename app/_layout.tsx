import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { configureNotificationHandler } from '../src/lib/reminders';
import { AppStateProvider } from '../src/state/AppState';

// Held open here rather than left to auto-hide, so app/index.tsx can keep it up
// through the AsyncStorage onboarding read and Firebase's first auth callback.
// Without this the paper background flashes behind the splash for a frame.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Once, at module scope, same as the splash hold above: decides whether a
// notification that arrives while the app is in the foreground gets shown at all.
configureNotificationHandler();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="group/create" options={{ presentation: 'modal' }} />
            <Stack.Screen name="group/join" options={{ presentation: 'modal' }} />
            <Stack.Screen name="admin" options={{ presentation: 'modal' }} />
            {/* Swiping back out of the ceremony would undercut "one button: Done,
                nothing else." */}
            <Stack.Screen name="hike/summary" options={{ gestureEnabled: false }} />
          </Stack>
          <StatusBar style="auto" />
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
