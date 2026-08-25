/**
 * Seeds the curated trail catalog into Firestore's `trails` collection.
 *
 * Auth: uses Application Default Credentials. Point GOOGLE_APPLICATION_CREDENTIALS
 * at a service account key (Firebase console → Project settings → Service accounts).
 * Against the local emulator instead, set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
 * (the Admin SDK reads it automatically) and no real credentials are needed.
 *
 * Idempotent: each trail has a fixed doc ID, so re-running overwrites rather than
 * duplicating. Run with `npm run seed`.
 */
import './nodeAssetStub';

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { trails } from '../src/data/trails';

async function main() {
  // Application Default Credentials reads GOOGLE_APPLICATION_CREDENTIALS itself when set.
  const app = process.env.FIRESTORE_EMULATOR_HOST
    ? initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'trail-dev' })
    : initializeApp({ credential: applicationDefault() });
  const db = getFirestore(app);

  const batch = db.batch();
  for (const { id, photo, ...trail } of trails) {
    // `photo` is a bundled asset handle that only means anything inside the app
    // bundle, so Firestore stores photoUrl instead.
    void photo;
    batch.set(db.collection('trails').doc(id), trail);
  }
  await batch.commit();

  console.log(`Seeded ${trails.length} trails.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
