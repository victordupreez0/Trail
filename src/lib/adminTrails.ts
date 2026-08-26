import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from './firebase';

export type AdminTrail = {
  id: string;
  name: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  distanceM: number;
  elevationGainM: number;
  region: string;
  description: string;
  photoUrl: string;
  location: { latitude: number; longitude: number };
  path: { latitude: number; longitude: number }[];
};

export type AdminTrailInput = Omit<AdminTrail, 'id'>;

const trailsRef = collection(db, 'trails');

export function subscribeToAdminTrails(
  callback: (trails: AdminTrail[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(trailsRef, orderBy('name')),
    (snap) => callback(snap.docs.map((trail) => ({ id: trail.id, ...trail.data() }) as AdminTrail)),
    onError,
  );
}

export function createAdminTrail(trail: AdminTrailInput) {
  return addDoc(trailsRef, trail);
}

export function updateAdminTrail(id: string, trail: AdminTrailInput) {
  return updateDoc(doc(db, 'trails', id), trail);
}

export function deleteAdminTrail(id: string) {
  return deleteDoc(doc(db, 'trails', id));
}
