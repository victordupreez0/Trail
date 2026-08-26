import { readFileSync } from 'fs';
import path from 'path';

import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, increment, setDoc, updateDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const GROUP_ID = 'group-1';
const MEMBER_A = 'alice';
const MEMBER_B = 'bob';
const OUTSIDER = 'carol';
const ADMIN = 'admin';
const INVITE_CODE = 'TRAIL1';

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
    await setDoc(doc(db, 'inviteCodes', INVITE_CODE), {
      groupId: GROUP_ID,
      active: true,
    });
    await setDoc(doc(db, 'admins', ADMIN), { enabled: true });
  });
});

test('a non-member can read an invite code', async () => {
  const carol = testEnv.authenticatedContext(OUTSIDER).firestore();
  await assertSucceeds(getDoc(doc(carol, 'inviteCodes', INVITE_CODE)));
});

test('a non-member cannot read the group itself', async () => {
  const carol = testEnv.authenticatedContext(OUTSIDER).firestore();
  await assertFails(getDoc(doc(carol, 'groups', GROUP_ID)));
});

test("a non-member cannot write to the group's positions", async () => {
  const carol = testEnv.authenticatedContext(OUTSIDER).firestore();
  await assertFails(
    setDoc(doc(carol, 'groups', GROUP_ID, 'positions', OUTSIDER), {
      position: { latitude: -33.91, longitude: 18.41 },
      updatedAt: Date.now(),
    }),
  );
});

test('the group owner can deactivate its invite code', async () => {
  const alice = testEnv.authenticatedContext(MEMBER_A).firestore();
  await assertSucceeds(
    setDoc(
      doc(alice, 'inviteCodes', INVITE_CODE),
      { groupId: GROUP_ID, active: false },
      { merge: true },
    ),
  );
});

test("a non-owner cannot deactivate the group's invite code", async () => {
  const bob = testEnv.authenticatedContext(MEMBER_B).firestore();
  await assertFails(
    setDoc(
      doc(bob, 'inviteCodes', INVITE_CODE),
      { groupId: GROUP_ID, active: false },
      { merge: true },
    ),
  );
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

test("a user cannot write someone else's profile", async () => {
  const bob = testEnv.authenticatedContext(MEMBER_B).firestore();
  await assertFails(setDoc(doc(bob, 'users', MEMBER_A), { displayName: 'Not Alice' }));
});

// P4/P5/P6 all write new fields (waterMl, reminder settings, photoURL) onto the
// existing users/{uid} doc rather than a new collection, so what actually needs
// proving is that the generic isSelf() rule still holds for an update - not just
// the setDoc already covered above - and for a Firestore increment specifically,
// since that's the exact write shape logWater uses.
test('a user can increment their own waterMl', async () => {
  const alice = testEnv.authenticatedContext(MEMBER_A).firestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', MEMBER_A), { waterMl: 0 });
  });
  await assertSucceeds(updateDoc(doc(alice, 'users', MEMBER_A), { waterMl: increment(250) }));
});

test("a user cannot increment someone else's waterMl", async () => {
  const bob = testEnv.authenticatedContext(MEMBER_B).firestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', MEMBER_A), { waterMl: 0 });
  });
  await assertFails(updateDoc(doc(bob, 'users', MEMBER_A), { waterMl: increment(250) }));
});

test('a signed-in user can read the trail catalog', async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'trails', 'trail-1'), { name: "Lion's Head" });
  });
  const alice = testEnv.authenticatedContext(MEMBER_A).firestore();
  await assertSucceeds(getDoc(doc(alice, 'trails', 'trail-1')));
});

test('a non-admin cannot write to the trail catalog', async () => {
  const alice = testEnv.authenticatedContext(MEMBER_A).firestore();
  await assertFails(setDoc(doc(alice, 'trails', 'trail-2'), { name: "Devil's Peak" }));
});

test('an admin can create, update, and delete trails', async () => {
  const admin = testEnv.authenticatedContext(ADMIN).firestore();
  const trail = doc(admin, 'trails', 'trail-2');
  await assertSucceeds(setDoc(trail, { name: "Devil's Peak" }));
  await assertSucceeds(updateDoc(trail, { name: 'Devil’s Peak' }));
  await assertSucceeds(deleteDoc(trail));
});

test('an admin record cannot be self-created or read by someone else', async () => {
  const alice = testEnv.authenticatedContext(MEMBER_A).firestore();
  await assertFails(setDoc(doc(alice, 'admins', MEMBER_A), { enabled: true }));
  await assertFails(getDoc(doc(alice, 'admins', ADMIN)));
});

test('a user can recommend a trail, but only an admin can remove it', async () => {
  const alice = testEnv.authenticatedContext(MEMBER_A).firestore();
  const recommendation = doc(alice, 'trailRecommendations', 'recommendation-1');
  await assertSucceeds(
    setDoc(recommendation, { name: 'Signal Hill', authorId: MEMBER_A, description: 'Sunset loop' }),
  );
  await assertFails(deleteDoc(recommendation));

  const admin = testEnv.authenticatedContext(ADMIN).firestore();
  await assertSucceeds(deleteDoc(doc(admin, 'trailRecommendations', 'recommendation-1')));
});
