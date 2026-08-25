import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Values come from EXPO_PUBLIC_* env vars (see .env.example) so they land in the
// bundle at build time, so no expo-constants plumbing is needed.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Metro resolves firebase/auth's "react-native" export condition, which persists
// sessions to AsyncStorage automatically, so no getReactNativePersistence call is needed
// (that pattern is obsolete as of Firebase JS SDK v11+).
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
