import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

import { auth, db, storage } from './firebase';

// A local file:// URI needs to become a Blob before Storage will accept it. Plain
// fetch(uri).then(r => r.blob()) is unreliable on React Native's fetch polyfill for
// local files; XMLHttpRequest is the documented workaround.
function readLocalFileAsBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Could not read the selected photo.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

export async function uploadAvatar(
  uid: string,
  localUri: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  // Compression happens at the picker (quality + allowsEditing in ProfileScreen),
  // not here, so a multi-megabyte camera original is never uploaded as-is.
  const blob = await readLocalFileAsBlob(localUri);
  const avatarRef = ref(storage, `avatars/${uid}`);
  const task = uploadBytesResumable(avatarRef, blob);

  try {
    await new Promise<void>((resolve, reject) => {
      task.on(
        'state_changed',
        (snapshot) => onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes),
        reject,
        () => resolve(),
      );
    });
  } finally {
    // Releases the native blob resource; RN's Blob implementation doesn't garbage
    // collect this on its own.
    if ('close' in blob && typeof blob.close === 'function') blob.close();
  }

  const url = await getDownloadURL(avatarRef);
  await updateDoc(doc(db, 'users', uid), { photoURL: url });
  if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: url });
  return url;
}

export async function removeAvatar(uid: string): Promise<void> {
  await deleteObject(ref(storage, `avatars/${uid}`)).catch((err: unknown) => {
    // Already gone is fine (e.g. removed once already); anything else surfaces.
    if ((err as { code?: string })?.code !== 'storage/object-not-found') throw err;
  });
  await updateDoc(doc(db, 'users', uid), { photoURL: null });
  if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: null });
}
