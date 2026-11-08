import { router } from 'expo-router';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert, Share } from 'react-native';

import { GroupsScreen } from '../src/screens/GroupsScreen';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }));
jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: 'MapView',
  Polyline: 'Polyline',
  Marker: 'Marker',
}));
jest.mock('../src/hooks/useTabBarInset', () => ({ useTabBarInset: () => 0 }));
jest.mock('../src/hooks/useMotion', () => ({
  useMotion: () => ({ reduced: false, spring: {} }),
}));

let mockLocationStatus = 'tracking';
const mockRetry = jest.fn();
jest.mock('../src/hooks/useLiveLocation', () => ({
  useLiveLocation: () => ({ status: mockLocationStatus, retry: mockRetry }),
}));

const NOW = 2_000_000_000_000;
const trail = {
  id: 't',
  name: "Lion's Head",
  location: { latitude: -33.9, longitude: 18.4 },
  path: [],
};
const hike = {
  id: 'g1',
  name: 'Sunrise crew',
  trailId: 't',
  ownerId: 'alice',
  memberIds: ['alice', 'sam'],
  active: true,
  inviteCode: 'ABC123',
  startedAt: { toMillis: () => 1000 },
  endedAt: null,
};

const mockState = {
  user: { uid: 'alice', displayName: 'Alice', email: null } as object | null,
  activeGroup: hike as typeof hike | null,
  groupLoading: false,
  endHike: jest.fn(),
  trails: [trail],
  syncFailed: false,
  retrySync: jest.fn(),
};
let mockPositions: Record<string, unknown> = {};

jest.mock('../src/state/AppState', () => ({
  useAppState: () => mockState,
  usePartyPositions: () => mockPositions,
}));

const position = (displayName: string, ageMs: number) => ({
  displayName,
  position: { latitude: -33.9, longitude: 18.4 },
  accuracy: 5,
  batteryLevel: 0.8,
  moving: true,
  updatedAt: { toMillis: () => NOW - ageMs },
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
  mockLocationStatus = 'tracking';
  mockPositions = {};
  mockState.user = { uid: 'alice', displayName: 'Alice', email: null };
  mockState.activeGroup = hike;
  mockState.groupLoading = false;
  mockState.syncFailed = false;
  mockState.endHike.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('with no hike it offers to start or join one', async () => {
  mockState.activeGroup = null;
  await render(<GroupsScreen />);
  expect(screen.getByText('No active hike')).toBeTruthy();
  expect(screen.getByLabelText('Start a hike')).toBeTruthy();
  expect(screen.getByLabelText('Join with a code')).toBeTruthy();
});

test('a failed load offers a retry rather than an endless skeleton', async () => {
  mockState.activeGroup = null;
  mockState.syncFailed = true;
  await render(<GroupsScreen />);
  await fireEvent.press(screen.getByLabelText('Try again'));
  expect(mockState.retrySync).toHaveBeenCalled();
});

test('the invite code can be shared', async () => {
  const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
  await render(<GroupsScreen />);
  expect(screen.getByText('ABC123')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Share invite code A B C 1 2 3'));
  expect(share).toHaveBeenCalledWith({
    message: 'Join my hike on Trail with this code: ABC123',
  });
});

test('ending a hike asks first, and only ends it on confirmation', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await render(<GroupsScreen />);
  await fireEvent.press(screen.getByLabelText('End hike'));
  expect(mockState.endHike).not.toHaveBeenCalled();

  const buttons = alert.mock.calls[0][2]!;
  buttons.find((b) => b.text === 'End hike')!.onPress!();
  expect(mockState.endHike).toHaveBeenCalled();
});

test('only the owner sees End hike', async () => {
  mockState.user = { uid: 'sam', displayName: 'Sam', email: null };
  await render(<GroupsScreen />);
  expect(screen.queryByLabelText('End hike')).toBeNull();
});

test('everyone is taken to the summary when the hike ends', async () => {
  const view = await render(<GroupsScreen />);
  mockState.activeGroup = null;
  await view.rerender(<GroupsScreen />);
  expect(router.push).toHaveBeenCalledWith('/hike/summary?trailId=t&startedAtMs=1000&partySize=2');
});

test('signing out mid-hike does not open the summary', async () => {
  const view = await render(<GroupsScreen />);
  mockState.user = null;
  mockState.activeGroup = null;
  await view.rerender(<GroupsScreen />);
  expect(router.push).not.toHaveBeenCalled();
});

test('a hiker gone quiet for 2 minutes raises the alert', async () => {
  mockPositions = { sam: position('Sam', 120_000) };
  await render(<GroupsScreen />);
  expect(screen.getByText("Sam hasn't checked in for 2 minutes")).toBeTruthy();
});

test('a hiker reporting in normally raises no alert', async () => {
  mockPositions = { sam: position('Sam', 5_000) };
  await render(<GroupsScreen />);
  expect(screen.queryByText(/hasn't checked in/)).toBeNull();
});

test('location being denied says so and links to settings', async () => {
  mockLocationStatus = 'denied';
  await render(<GroupsScreen />);
  expect(screen.getByText(/Location access is off/)).toBeTruthy();
  expect(screen.getByLabelText('Open location settings')).toBeTruthy();
});

test('a location error can be retried', async () => {
  mockLocationStatus = 'error';
  await render(<GroupsScreen />);
  await fireEvent.press(screen.getByLabelText('Try getting your location again'));
  expect(mockRetry).toHaveBeenCalled();
});

test('a hike whose trail was deleted can still be ended', async () => {
  mockState.trails = [];
  await render(<GroupsScreen />);
  expect(screen.getByText('Trail no longer listed')).toBeTruthy();
  expect(screen.getByLabelText('End hike')).toBeTruthy();
  mockState.trails = [trail];
});
