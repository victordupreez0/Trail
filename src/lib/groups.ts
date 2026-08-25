import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from './firebase';
import { makeInviteCode } from './inviteCode';
import type { Group } from '../types/models';

function fromDoc(id: string, data: Omit<Group, 'id'>): Group {
  return { id, ...data };
}

export async function createGroup(owner: string, name: string, trailId: string): Promise<Group> {
  const groupRef = doc(collection(db, 'groups'));
  const inviteCode = makeInviteCode();
  const codeRef = doc(db, 'inviteCodes', inviteCode);

  const group: Omit<Group, 'id'> = {
    name,
    trailId,
    ownerId: owner,
    memberIds: [owner],
    active: true,
    inviteCode,
    startedAt: null,
    endedAt: null,
  };

  const batch = writeBatch(db);
  batch.set(groupRef, { ...group, startedAt: serverTimestamp() });
  batch.set(codeRef, { groupId: groupRef.id, active: true });
  await batch.commit();

  return fromDoc(groupRef.id, group);
}

export async function findGroupByInviteCode(code: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'inviteCodes', code));
  if (!snap.exists()) return null;
  const data = snap.data() as { groupId: string; active: boolean };
  return data.active ? data.groupId : null;
}

export async function joinGroup(groupId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), { memberIds: arrayUnion(uid) });
}

export async function endGroup(groupId: string, inviteCode: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'groups', groupId), { active: false, endedAt: serverTimestamp() });
  batch.update(doc(db, 'inviteCodes', inviteCode), { active: false });
  await batch.commit();
}

export function subscribeToGroup(groupId: string, cb: (group: Group | null) => void): Unsubscribe {
  return onSnapshot(
    doc(db, 'groups', groupId),
    (snap) => cb(snap.exists() ? fromDoc(snap.id, snap.data() as Omit<Group, 'id'>) : null),
    (err) => console.warn('subscribeToGroup failed', err),
  );
}

// The active group is self-discovering: create or join one and it appears here, end
// it and it leaves, with no separate "which group am I in" pointer to keep in sync.
export function subscribeToActiveGroupForUser(
  uid: string,
  cb: (group: Group | null) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'groups'),
    where('memberIds', 'array-contains', uid),
    where('active', '==', true),
    limit(1),
  );
  return onSnapshot(
    q,
    (snap) =>
      cb(snap.empty ? null : fromDoc(snap.docs[0].id, snap.docs[0].data() as Omit<Group, 'id'>)),
    (err) => console.warn('subscribeToActiveGroupForUser failed', err),
  );
}
