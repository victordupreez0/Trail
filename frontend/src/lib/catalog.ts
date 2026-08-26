import { collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';

import { trails as bundledTrails, type Trail } from '../data/trails';
import { db } from './firebase';

export function subscribeToCatalog(
  callback: (trails: Trail[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'trails'), orderBy('name')),
    (snap) => {
      const catalog = snap.docs.map((trail) => {
        const data = trail.data();
        const bundled = bundledTrails.find((item) => item.id === trail.id);
        return {
          id: trail.id,
          name: data.name,
          difficulty: data.difficulty,
          distanceM: data.distanceM,
          elevationGainM: data.elevationGainM,
          region: data.region,
          description: data.description,
          photoUrl: data.photoUrl,
          // Seeded trails already have a matching image in the app bundle. Keeping
          // that source avoids re-downloading the whole Discover deck on every
          // cold start; admin-created trails fall back to their remote photo URL.
          photo: bundled?.photo ?? { uri: data.photoUrl },
          location: data.location,
          path: data.path,
        } as Trail;
      });
      callback(catalog.length ? catalog : bundledTrails);
    },
    onError,
  );
}
