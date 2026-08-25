import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStateProvider } from '../src/state/AppState';

// Held open here rather than left to auto-hide, so app/index.tsx can keep it up
// through the AsyncStorage onboarding read and Firebase's first auth callback.
// Without this the paper background flashes behind the splash for a frame.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="group/create" options={{ presentation: 'modal' }} />
            <Stack.Screen name="group/join" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
