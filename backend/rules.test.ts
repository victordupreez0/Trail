import { readFileSync } from 'fs';
import path from 'path';

import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const GROUP_ID = 'group-1';
const MEMBER_A = 'alice';
const MEMBER_B = 'bob';
const OUTSIDER = 'carol';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'trail-rules-test',
    firestore: {
      rules: readFileSync(path.resolve(__dirname, './firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'groups', GROUP_ID), {
      name: 'Table Mountain crew',
      trailId: 'trail-1',
      ownerId: MEMBER_A,
      memberIds: [MEMBER_A, MEMBER_B],
      active: true,
    });
    await setDoc(doc(db, 'groups', GROUP_ID, 'positions', MEMBER_A), {
      position: { latitude: -33.9, longitude: 18.4 },
      updatedAt: Date.now(),
    });
  });
});

test('a group member can read the party positions', async () => {
  const bob = testEnv.authenticatedContext(MEMBER_B).firestore();
  await assertSucceeds(getDoc(doc(bob, 'groups', GROUP_ID, 'positions', MEMBER_A)));
});

test('a non-member cannot read the party positions', async () => {
  const carol = testEnv.authenticatedContext(OUTSIDER).firestore();
  await assertFails(getDoc(doc(carol, 'groups', GROUP_ID, 'positions', MEMBER_A)));
});

test('a member can write their own position', async () => {
  const bob = testEnv.authenticatedContext(MEMBER_B).firestore();
  await assertSucceeds(
    setDoc(doc(bob, 'groups', GROUP_ID, 'positions', MEMBER_B), {
      position: { latitude: -33.91, longitude: 18.41 },
      updatedAt: Date.now(),
    }),
  );
});

test("a member cannot write another member's position", async () => {
  const bob = testEnv.authenticatedContext(MEMBER_B).firestore();
  await assertFails(
    setDoc(doc(bob, 'groups', GROUP_ID, 'positions', MEMBER_A), {
      position: { latitude: -33.91, longitude: 18.41 },
      updatedAt: Date.now(),
    }),
  );
});

test('a user can read and write their own profile', async () => {
  const alice = testEnv.authenticatedContext(MEMBER_A).firestore();
  await assertSucceeds(setDoc(doc(alice, 'users', MEMBER_A), { displayName: 'Alice' }));
});

test("a user cannot read someone else's profile", async () => {
  const bob = testEnv.authenticatedContext(MEMBER_B).firestore();
  await assertFails(getDoc(doc(bob, 'users', MEMBER_A)));
});

test('a signed-in user can read the trail catalog', async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'trails', 'trail-1'), { name: "Lion's Head" });
  });
  const alice = testEnv.authenticatedContext(MEMBER_A).firestore();
  await assertSucceeds(getDoc(doc(alice, 'trails', 'trail-1')));
});

test('a client cannot write to the trail catalog', async () => {
  const alice = testEnv.authenticatedContext(MEMBER_A).firestore();
  await assertFails(setDoc(doc(alice, 'trails', 'trail-2'), { name: "Devil's Peak" }));
});
