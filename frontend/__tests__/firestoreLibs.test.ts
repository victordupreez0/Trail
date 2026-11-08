import * as firestore from 'firebase/firestore';

import { subscribeToCatalog } from '../src/lib/catalog';
import {
  createGroup,
  endGroup,
  findGroupByInviteCode,
  joinGroup,
  subscribeToActiveGroupForUser,
} from '../src/lib/groups';
import { subscribeToPositions, writePosition } from '../src/lib/positions';
import { saveTrail, unsaveTrail, updateSavedTrailNote } from '../src/lib/savedTrails';
import { ensureUserDoc, logWater, subscribeToUserDoc } from '../src/lib/userDoc';

jest.mock('../src/lib/firebase', () => ({ db: 'db' }));

const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

jest.mock('firebase/firestore', () => ({
  arrayUnion: jest.fn((v) => ({ arrayUnion: v })),
  collection: jest.fn((...path) => ({ path: path.slice(1).join('/') })),
  doc: jest.fn((first, ...path) =>
    typeof first === 'object' && path.length === 0
      ? { path: `${first.path}/generated`, id: 'generated' }
      : { path: path.join('/'), id: path[path.length - 1] },
  ),
  getDoc: jest.fn(),
  increment: jest.fn((n) => ({ increment: n })),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn((...args) => args[0]),
  serverTimestamp: jest.fn(() => 'SERVER_TIME'),
  setDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  where: jest.fn(),
  writeBatch: jest.fn(() => mockBatch),
}));

const getDoc = firestore.getDoc as jest.Mock;
const onSnapshot = firestore.onSnapshot as jest.Mock;
const setDoc = firestore.setDoc as jest.Mock;
const updateDoc = firestore.updateDoc as jest.Mock;
const deleteDoc = firestore.deleteDoc as jest.Mock;

const listenerFailure = () => {
  const [, , fail] = onSnapshot.mock.calls[0];
  jest.spyOn(console, 'warn').mockImplementationOnce(() => {});
  fail(new Error('denied'));
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('hikes', () => {
  test('creating a hike writes the group and its invite code together', async () => {
    const group = await createGroup('alice', 'Crew', 't');
    expect(mockBatch.set).toHaveBeenCalledTimes(2);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    expect(group).toMatchObject({ ownerId: 'alice', memberIds: ['alice'], active: true });
    expect(group.inviteCode).toHaveLength(6);
  });

  test('an active code finds its hike', async () => {
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ groupId: 'g1', active: true }) });
    await expect(findGroupByInviteCode('ABC123')).resolves.toBe('g1');
  });

  test('an ended hike cannot be joined by its old code', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ groupId: 'g1', active: false }),
    });
    await expect(findGroupByInviteCode('ABC123')).resolves.toBeNull();
  });

  test('an unknown code finds nothing', async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    await expect(findGroupByInviteCode('NOPE00')).resolves.toBeNull();
  });

  test('joining only adds yourself', async () => {
    await joinGroup('g1', 'bob');
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { memberIds: { arrayUnion: 'bob' } });
  });

  test('ending a hike retires its code in the same write', async () => {
    await endGroup('g1', 'ABC123');
    expect(mockBatch.update).toHaveBeenCalledTimes(2);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  test('a failed hike listener reports the failure', () => {
    const onError = jest.fn();
    subscribeToActiveGroupForUser('alice', jest.fn(), onError);
    listenerFailure();
    expect(onError).toHaveBeenCalled();
  });

  test('the listener reports no hike when the query is empty', () => {
    const cb = jest.fn();
    subscribeToActiveGroupForUser('alice', cb, jest.fn());
    onSnapshot.mock.calls[0][1]({ empty: true, docs: [] });
    expect(cb).toHaveBeenCalledWith(null);
  });
});

describe('positions', () => {
  test('a position is stamped by the server, not the phone', async () => {
    await writePosition('g1', 'alice', {
      displayName: 'Alice',
      position: { latitude: 1, longitude: 2 },
      accuracy: 5,
      batteryLevel: 0.5,
      moving: true,
    });
    expect(setDoc.mock.calls[0][1].updatedAt).toBe('SERVER_TIME');
    expect(setDoc.mock.calls[0][2]).toEqual({ merge: true });
  });

  test('snapshots are keyed by member', () => {
    const cb = jest.fn();
    subscribeToPositions('g1', cb, jest.fn());
    onSnapshot.mock.calls[0][1]({ docs: [{ id: 'sam', data: () => ({ displayName: 'Sam' }) }] });
    expect(cb).toHaveBeenCalledWith({ sam: { displayName: 'Sam' } });
  });

  test('a failed position listener reports the failure', () => {
    const onError = jest.fn();
    subscribeToPositions('g1', jest.fn(), onError);
    listenerFailure();
    expect(onError).toHaveBeenCalled();
  });
});

describe('profile', () => {
  test('an existing profile is left alone', async () => {
    getDoc.mockResolvedValue({ exists: () => true });
    await ensureUserDoc('alice', 'Alice', 'a@b.c');
    expect(setDoc).not.toHaveBeenCalled();
  });

  test('a new account gets sensible defaults', async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    await ensureUserDoc('alice', 'Alice', 'a@b.c');
    expect(setDoc.mock.calls[0][1]).toMatchObject({
      hydrationGoalMl: 2000,
      waterMl: 0,
      remindersEnabled: true,
      waterIntervalMin: 30,
      restIntervalMin: 90,
    });
  });

  test('water logged on the same day adds to the total', async () => {
    await logWater('alice', 250, true);
    expect(updateDoc.mock.calls[0][1]).toEqual({ waterMl: { increment: 250 } });
  });

  test('the first water of a new day starts a fresh total', async () => {
    await logWater('alice', 250, false);
    expect(updateDoc.mock.calls[0][1]).toMatchObject({ waterMl: 250 });
    expect(updateDoc.mock.calls[0][1].waterDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('a failed profile listener reports the failure', () => {
    const onError = jest.fn();
    subscribeToUserDoc('alice', jest.fn(), onError);
    listenerFailure();
    expect(onError).toHaveBeenCalled();
  });
});

describe('saved trails', () => {
  test('saving records when it happened', async () => {
    await saveTrail('alice', 't');
    expect(setDoc.mock.calls[0][1]).toEqual({ savedAt: 'SERVER_TIME' });
  });

  test('unsaving deletes the record', async () => {
    await unsaveTrail('alice', 't');
    expect(deleteDoc).toHaveBeenCalledTimes(1);
  });

  test('a note is merged so it cannot wipe when the trail was saved', async () => {
    await updateSavedTrailNote('alice', 't', 'Bring water');
    expect(setDoc.mock.calls[0][1]).toEqual({ notes: 'Bring water' });
    expect(setDoc.mock.calls[0][2]).toEqual({ merge: true });
  });
});

describe('trail catalogue', () => {
  test('an empty catalogue falls back to the trails in the app', () => {
    const cb = jest.fn();
    subscribeToCatalog(cb, jest.fn());
    onSnapshot.mock.calls[0][1]({ docs: [] });
    expect(cb.mock.calls[0][0].length).toBeGreaterThan(0);
  });

  test('a trail added by an admin uses its remote photo', () => {
    const cb = jest.fn();
    subscribeToCatalog(cb, jest.fn());
    onSnapshot.mock.calls[0][1]({
      docs: [{ id: 'new-one', data: () => ({ name: 'New', photoUrl: 'https://x/y.jpg' }) }],
    });
    expect(cb.mock.calls[0][0][0].photo).toEqual({ uri: 'https://x/y.jpg' });
  });

  test('a seeded trail keeps the photo bundled with the app', () => {
    const cb = jest.fn();
    subscribeToCatalog(cb, jest.fn());
    onSnapshot.mock.calls[0][1]({
      docs: [{ id: 'lions-head', data: () => ({ name: 'L', photoUrl: 'https://x/y.jpg' }) }],
    });
    expect(cb.mock.calls[0][0][0].photo).not.toEqual({ uri: 'https://x/y.jpg' });
  });
});
