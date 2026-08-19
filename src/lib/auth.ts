import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import { auth } from './firebase';

export { authMessage } from './authMessage';

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
  return credential;
}

export function signOutNow() {
  return signOut(auth);
}
