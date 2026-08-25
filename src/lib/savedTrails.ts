import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from './firebase';

// Same shape the existing toggle wrote: savedAt only. notes is added separately by
// updateSavedTrailNote so an existing save's note survives an unrelated re-save.
export function saveTrail(uid: string, trailId: string) {
  return setDoc(doc(db, 'users', uid, 'savedTrails', trailId), { savedAt: serverTimestamp() });
}

export function unsaveTrail(uid: string, trailId: string) {
  return deleteDoc(doc(db, 'users', uid, 'savedTrails', trailId));
}

export function updateSavedTrailNote(uid: string, trailId: string, note: string) {
  return setDoc(doc(db, 'users', uid, 'savedTrails', trailId), { notes: note }, { merge: true });
}
