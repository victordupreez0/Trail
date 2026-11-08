import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render } from '@testing-library/react-native';

import * as groups from '../src/lib/groups';
import * as reminders from '../src/lib/reminders';
import * as savedTrails from '../src/lib/savedTrails';
import { AppStateProvider, useAppState, usePartyPositions } from '../src/state/AppState';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

let mockAuthCallback: (user: unknown) => void = () => {};
let mockSavedError: (err: Error) => void = () => {};
let mockGroupCallback: (group: unknown) => void = () => {};
let mockPositionsCallback: (positions: unknown) => void = () => {};
let mockUserCallback: (doc: unknown) => void = () => {};

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: unknown) => void) => {
    mockAuthCallback = cb;
    return () => {};
  },
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  onSnapshot: (_ref: unknown, next: (s: unknown) => void, error: (e: Error) => void) => {
    mockSavedError = error;
    next({ docs: [] });
    return () => {};
  },
}));
jest.mock('../src/lib/firebase', () => ({ auth: {}, db: {} }));
jest.mock('../src/lib/auth', () => ({
  signIn: jest.fn(),
  signUp: jest.fn().mockResolvedValue(undefined),
  signOutNow: jest.fn(),
}));
jest.mock('../src/lib/catalog', () => ({ subscribeToCatalog: jest.fn(() => () => {}) }));
jest.mock('../src/lib/groups', () => ({
  createGroup: jest.fn().mockResolvedValue({ id: 'new' }),
  endGroup: jest.fn().mockResolvedValue(undefined),
  findGroupByInviteCode: jest.fn().mockResolvedValue('g1'),
  joinGroup: jest.fn().mockResolvedValue(undefined),
  subscribeToActiveGroupForUser: jest.fn((_uid: string, cb: (g: unknown) => void) => {
    mockGroupCallback = cb;
    return () => {};
  }),
}));
jest.mock('../src/lib/positions', () => ({
  subscribeToPositions: jest.fn((_id: string, cb: (p: unknown) => void) => {
    mockPositionsCallback = cb;
    return () => {};
  }),
}));
jest.mock('../src/lib/reminders', () => ({
  cancelHikeReminders: jest.fn().mockResolvedValue(undefined),
  hasPermission: jest.fn().mockResolvedValue(true),
  requestPermission: jest.fn().mockResolvedValue(true),
  scheduleHikeReminders: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/lib/savedTrails', () => ({
  saveTrail: jest.fn().mockResolvedValue(undefined),
  unsaveTrail: jest.fn().mockResolvedValue(undefined),
  updateSavedTrailNote: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/lib/userDoc', () => ({
  ensureUserDoc: jest.fn().mockResolvedValue(undefined),
  logWater: jest.fn(),
  setHydrationGoal: jest.fn(),
  setReminderSettings: jest.fn(),
  subscribeToUserDoc: jest.fn((_uid: string, cb: (d: unknown) => void) => {
    mockUserCallback = cb;
    return () => {};
  }),
}));

type App = ReturnType<typeof useAppState>;
let app: App;
let mainRenders = 0;
let positionsSeen: unknown;

function MainProbe() {
  app = useAppState();
  mainRenders++;
  return null;
}
function PositionsProbe() {
  positionsSeen = usePartyPositions();
  return null;
}

const ALICE = { uid: 'alice', displayName: 'Alice', email: 'alice@test.com' };
const BOB = { uid: 'bob', displayName: 'Bob', email: 'bob@test.com' };
const HIKE = {
  id: 'g1',
  ownerId: 'alice',
  memberIds: ['alice'],
  active: true,
  inviteCode: 'ABC123',
  trailId: 't',
};

const setup = async () => {
  await render(
    <AppStateProvider>
      <MainProbe />
      <PositionsProbe />
    </AppStateProvider>,
  );
};
const emit = (fn: () => void) =>
  act(async () => {
    fn();
  });
const signInAs = (user: unknown) => emit(() => mockAuthCallback(user));

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  mainRenders = 0;
  (reminders.hasPermission as jest.Mock).mockResolvedValue(true);
});

test('the intro shows once per account, not once per phone', async () => {
  await setup();
  await signInAs(ALICE);
  expect(app.onboardingReady).toBe(true);
  expect(app.hasOnboarded).toBe(false);

  await emit(() => app.completeOnboarding());
  expect(app.hasOnboarded).toBe(true);

  await signInAs(BOB);
  expect(app.hasOnboarded).toBe(false);

  await signInAs(ALICE);
  expect(app.hasOnboarded).toBe(true);
});

test('the intro can be replayed', async () => {
  await setup();
  await signInAs(ALICE);
  await emit(() => app.completeOnboarding());
  await emit(() => app.replayOnboarding());
  expect(app.hasOnboarded).toBe(false);
  expect(await AsyncStorage.getItem('trail.hasOnboarded.alice')).toBeNull();
});

test('a second hike cannot be started while one is active', async () => {
  await setup();
  await signInAs(ALICE);
  await emit(() => mockGroupCallback(HIKE));
  await expect(app.createGroup('Second', 't')).rejects.toThrow("You're already on a hike");
  expect(groups.createGroup).not.toHaveBeenCalled();
});

test('a hike cannot be joined while one is active', async () => {
  await setup();
  await signInAs(ALICE);
  await emit(() => mockGroupCallback(HIKE));
  await expect(app.joinByCode('ABC123')).rejects.toThrow("You're already on a hike");
  expect(groups.joinGroup).not.toHaveBeenCalled();
});

test('starting a hike asks for reminder permission first', async () => {
  await setup();
  await signInAs(ALICE);
  await emit(() => mockGroupCallback(null));
  await app.createGroup('First', 't');
  expect(reminders.requestPermission).toHaveBeenCalled();
  expect(groups.createGroup).toHaveBeenCalledWith('alice', 'First', 't');
});

test('a hike still starts if reminder permission is refused', async () => {
  (reminders.requestPermission as jest.Mock).mockRejectedValueOnce(new Error('denied'));
  await setup();
  await signInAs(ALICE);
  await app.createGroup('First', 't');
  expect(groups.createGroup).toHaveBeenCalled();
});

test('an active hike schedules reminders, and ending it cancels them', async () => {
  await setup();
  await signInAs(ALICE);
  await emit(() => mockGroupCallback(HIKE));
  expect(reminders.scheduleHikeReminders).toHaveBeenCalledWith(30, 90);
  await emit(() => mockGroupCallback(null));
  expect(reminders.cancelHikeReminders).toHaveBeenCalled();
});

test('changing the interval mid-hike reschedules', async () => {
  await setup();
  await signInAs(ALICE);
  await emit(() => mockGroupCallback(HIKE));
  await emit(() => mockUserCallback({ waterIntervalMin: 1, restIntervalMin: 60 }));
  expect(reminders.scheduleHikeReminders).toHaveBeenLastCalledWith(1, 60);
});

test('with notifications off nothing is scheduled and the app says so', async () => {
  (reminders.hasPermission as jest.Mock).mockResolvedValue(false);
  await setup();
  await signInAs(ALICE);
  await emit(() => mockGroupCallback(HIKE));
  expect(reminders.scheduleHikeReminders).not.toHaveBeenCalled();
  expect(app.remindersBlocked).toBe(true);
});

test('a failed listener can be retried', async () => {
  await setup();
  await signInAs(ALICE);
  await emit(() => mockSavedError(new Error('denied')));
  expect(app.syncFailed).toBe(true);
  expect(app.savedTrailsLoading).toBe(false);

  const before = (groups.subscribeToActiveGroupForUser as jest.Mock).mock.calls.length;
  await emit(() => app.retrySync());
  expect(app.syncFailed).toBe(false);
  expect((groups.subscribeToActiveGroupForUser as jest.Mock).mock.calls.length).toBe(before + 1);
});

test('saving and unsaving go to the right write', async () => {
  await setup();
  await signInAs(ALICE);
  await app.setTrailSaved('t', true);
  expect(savedTrails.saveTrail).toHaveBeenCalledWith('alice', 't');
  await app.setTrailSaved('t', false);
  expect(savedTrails.unsaveTrail).toHaveBeenCalledWith('alice', 't');
});

test('only the owner can end a hike', async () => {
  await setup();
  await signInAs(BOB);
  await emit(() => mockGroupCallback(HIKE));
  await expect(app.endHike()).rejects.toThrow('Only the person who started');
  expect(groups.endGroup).not.toHaveBeenCalled();
});

test('position updates do not re-render screens that do not show the party', async () => {
  await setup();
  await signInAs(ALICE);
  await emit(() => mockGroupCallback(HIKE));
  const before = mainRenders;
  const positions = { sam: { displayName: 'Sam' } };
  await emit(() => mockPositionsCallback(positions));
  expect(positionsSeen).toBe(positions);
  expect(mainRenders).toBe(before);
});

test('signing up refreshes screens so the new name shows', async () => {
  await setup();
  await signInAs(ALICE);
  const before = app;
  await act(async () => {
    await app.signUp('Alice', 'alice@test.com', 'secret1');
  });
  expect(app).not.toBe(before);
});

test('asking for the Party tab counts up each time', async () => {
  await setup();
  await emit(() => app.showPartyTab());
  await emit(() => app.showPartyTab());
  expect(app.partyTabRequest).toBe(2);
});
