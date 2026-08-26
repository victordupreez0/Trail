import * as Notifications from 'expo-notifications';

// Fixed identifiers rather than tracked ids: there's only ever one water and one
// rest reminder active at a time, so scheduling reuses the same identifier (Android
// and iOS both replace a pending notification sharing an identifier) and cancelling
// is just "cancel this exact identifier", no bookkeeping needed.
const WATER_ID = 'trail-water-reminder';
const REST_ID = 'trail-rest-reminder';

// Calm, specific copy, never a shouted "REMINDER:" prefix - the app's whole point is
// not adding to the noise of a hike.
const WATER_MESSAGES = ['Time for water.', 'Worth a sip.', 'Your body could use some water.'];
const REST_MESSAGES = ['Worth a five-minute sit-down.', 'A short break, if you feel like it.'];

function pick(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export async function requestPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleHikeReminders(
  waterIntervalMinutes: number,
  restIntervalMinutes: number,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: WATER_ID,
    content: { title: 'Trail', body: pick(WATER_MESSAGES) },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: waterIntervalMinutes * 60,
      repeats: true,
    },
  });
  await Notifications.scheduleNotificationAsync({
    identifier: REST_ID,
    content: { title: 'Trail', body: pick(REST_MESSAGES) },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: restIntervalMinutes * 60,
      repeats: true,
    },
  });
}

// Cancels only what Trail scheduled, by identifier, rather than
// cancelAllScheduledNotificationsAsync, which would also clear anything a future
// feature schedules for an unrelated reason.
export async function cancelHikeReminders(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(WATER_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(REST_ID).catch(() => {});
}

// Configured once at app start (app/_layout.tsx). Local notifications only fire
// this while the app is foregrounded; while backgrounded the OS shows them itself,
// so this only decides in-app presentation.
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}
