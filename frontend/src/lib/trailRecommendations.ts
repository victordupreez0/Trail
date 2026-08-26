import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from './firebase';

export type TrailRecommendation = {
  id: string;
  name: string;
  region: string;
  description: string;
  photoUrl: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp | null;
};

type RecommendationInput = Pick<
  TrailRecommendation,
  'name' | 'region' | 'description' | 'photoUrl'
>;

const recommendationsRef = collection(db, 'trailRecommendations');

export function createTrailRecommendation(
  authorId: string,
  authorName: string,
  recommendation: RecommendationInput,
) {
  return addDoc(recommendationsRef, {
    ...recommendation,
    authorId,
    authorName,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToTrailRecommendations(
  callback: (recommendations: TrailRecommendation[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(recommendationsRef, orderBy('createdAt', 'desc')),
    (snap) =>
      callback(
        snap.docs.map(
          (recommendation) =>
            ({ id: recommendation.id, ...recommendation.data() }) as TrailRecommendation,
        ),
      ),
    onError,
  );
}

export function deleteTrailRecommendation(id: string) {
  return deleteDoc(doc(db, 'trailRecommendations', id));
}
