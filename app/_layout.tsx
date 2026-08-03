import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStateProvider } from '../src/state/AppState';

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
