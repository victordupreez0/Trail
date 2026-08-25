import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from './firebase';
import type { PartyPosition } from '../types/models';

type WritablePosition = Pick<PartyPosition, 'position' | 'accuracy' | 'batteryLevel' | 'moving'>;

export async function writePosition(
  groupId: string,
  uid: string,
  position: WritablePosition,
): Promise<void> {
  await setDoc(
    doc(db, 'groups', groupId, 'positions', uid),
    { ...position, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export function subscribeToPositions(
  groupId: string,
  cb: (positions: Record<string, PartyPosition>) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'groups', groupId, 'positions'),
    (snap) => {
      const positions: Record<string, PartyPosition> = {};
      for (const d of snap.docs) positions[d.id] = d.data() as PartyPosition;
      cb(positions);
    },
    (err) => console.warn('subscribeToPositions failed', err),
  );
}
