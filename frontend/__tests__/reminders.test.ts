import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  cancelHikeReminders,
  configureNotificationHandler,
  hasPermission,
  requestPermission,
  scheduleHikeReminders,
} from '../src/lib/reminders';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  setNotificationHandler: jest.fn(),
}));

const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
const askPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const schedule = Notifications.scheduleNotificationAsync as jest.Mock;
const setChannel = Notifications.setNotificationChannelAsync as jest.Mock;
const cancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;

const originalOS = Platform.OS;
const setPlatform = (os: string) => Object.defineProperty(Platform, 'OS', { value: os });

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  setPlatform(originalOS);
});

test('permission already given is not asked for again', async () => {
  getPermissions.mockResolvedValue({ granted: true });
  await expect(requestPermission()).resolves.toBe(true);
  expect(askPermissions).not.toHaveBeenCalled();
});

test('permission is asked for when missing', async () => {
  getPermissions.mockResolvedValue({ granted: false });
  askPermissions.mockResolvedValue({ granted: true });
  await expect(requestPermission()).resolves.toBe(true);
  expect(askPermissions).toHaveBeenCalled();
});

test('a refusal is reported', async () => {
  getPermissions.mockResolvedValue({ granted: false });
  askPermissions.mockResolvedValue({ granted: false });
  await expect(requestPermission()).resolves.toBe(false);
});

test('checking permission never prompts', async () => {
  getPermissions.mockResolvedValue({ granted: false });
  await expect(hasPermission()).resolves.toBe(false);
  expect(askPermissions).not.toHaveBeenCalled();
});

test('Android gets its channel before the prompt', async () => {
  setPlatform('android');
  getPermissions.mockResolvedValue({ granted: false });
  askPermissions.mockResolvedValue({ granted: true });
  await requestPermission();
  expect(setChannel.mock.invocationCallOrder[0]).toBeLessThan(
    askPermissions.mock.invocationCallOrder[0],
  );
});

test('iOS needs no channel', async () => {
  setPlatform('ios');
  getPermissions.mockResolvedValue({ granted: true });
  await requestPermission();
  expect(setChannel).not.toHaveBeenCalled();
});

test('reminders repeat on the chosen intervals', async () => {
  await scheduleHikeReminders(1, 90);
  expect(schedule).toHaveBeenCalledTimes(2);
  expect(schedule.mock.calls[0][0].trigger).toMatchObject({ seconds: 60, repeats: true });
  expect(schedule.mock.calls[1][0].trigger).toMatchObject({ seconds: 5400, repeats: true });
});

test('rescheduling reuses the same identifiers, so reminders never double up', async () => {
  await scheduleHikeReminders(30, 90);
  await scheduleHikeReminders(20, 60);
  expect(schedule.mock.calls[0][0].identifier).toBe(schedule.mock.calls[2][0].identifier);
  expect(schedule.mock.calls[1][0].identifier).toBe(schedule.mock.calls[3][0].identifier);
});

test('cancelling stops both reminders, even if one is already gone', async () => {
  cancel.mockRejectedValueOnce(new Error('not found'));
  await expect(cancelHikeReminders()).resolves.toBeUndefined();
  expect(cancel).toHaveBeenCalledTimes(2);
});

test('reminders show as a banner while the app is open, without sound', async () => {
  configureNotificationHandler();
  const { handleNotification } = (Notifications.setNotificationHandler as jest.Mock).mock
    .calls[0][0];
  await expect(handleNotification()).resolves.toMatchObject({
    shouldShowBanner: true,
    shouldPlaySound: false,
  });
});
