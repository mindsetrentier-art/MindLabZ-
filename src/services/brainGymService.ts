import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  BrainGymSessionInput,
  BrainGymSessionRecord,
  isValidBrainGymId,
  sanitizeBrainGymSessionInput,
} from '../utils/brainGymHelpers';

const GUEST_STORAGE_KEY = 'mindlabz_brain_gym_sessions_v1';
const MAX_LOCAL_SESSIONS = 100;

function getLocalStorageKey(userId?: string | null): string {
  return userId && isValidBrainGymId(userId)
    ? `mindlabz_brain_gym_sessions_${userId}`
    : GUEST_STORAGE_KEY;
}

function parseTimestampMs(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof val === 'object' && val !== null) {
    const maybeTs = val as { toMillis?: () => number; seconds?: number };
    if (typeof maybeTs.toMillis === 'function') return maybeTs.toMillis();
    if (typeof maybeTs.seconds === 'number') return maybeTs.seconds * 1000;
  }
  return 0;
}

export function sortBrainGymSessions(
  sessions: BrainGymSessionRecord[]
): BrainGymSessionRecord[] {
  return [...sessions].sort(
    (a, b) => parseTimestampMs(b.createdAt) - parseTimestampMs(a.createdAt)
  );
}

export function loadLocalBrainGymSessions(
  userId?: string | null
): BrainGymSessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getLocalStorageKey(userId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortBrainGymSessions(
      parsed
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          ...sanitizeBrainGymSessionInput({
            ...item,
            userId: userId || item.userId,
          }),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        }))
    );
  } catch (err) {
    console.warn('Failed to load local Brain Gym sessions:', err);
    return [];
  }
}

export function saveLocalBrainGymSessions(
  userId: string | null | undefined,
  sessions: BrainGymSessionRecord[]
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getLocalStorageKey(userId);
    window.localStorage.setItem(
      key,
      JSON.stringify(sessions.slice(0, MAX_LOCAL_SESSIONS))
    );
  } catch (err) {
    console.warn('Failed to save local Brain Gym sessions:', err);
  }
}

/**
 * Persist a completed Brain Gym training session.
 * Writes to `/users/{userId}/brainGymSessions/{sessionId}` when signed in,
 * and mirrors to localStorage for immediate offline availability.
 */
export async function recordBrainGymSession(
  userId: string | null | undefined,
  input: Omit<BrainGymSessionInput, 'id' | 'userId'> & { id?: string }
): Promise<BrainGymSessionRecord> {
  const currentUid = auth.currentUser?.uid || userId || 'guest_user';
  const prepared = sanitizeBrainGymSessionInput({
    ...input,
    userId: currentUid,
  });
  const nowIso = new Date().toISOString();

  if (auth.currentUser && auth.currentUser.uid === currentUid) {
    const docPath = `users/${currentUid}/brainGymSessions/${prepared.id}`;
    const docRef = doc(db, 'users', currentUid, 'brainGymSessions', prepared.id);
    try {
      await setDoc(docRef, {
        ...prepared,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  }

  const localRecord: BrainGymSessionRecord = {
    ...prepared,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const existing = loadLocalBrainGymSessions(currentUid);
  const next = sortBrainGymSessions([
    localRecord,
    ...existing.filter((item) => item.id !== prepared.id),
  ]);
  saveLocalBrainGymSessions(currentUid, next);
  return localRecord;
}

/**
 * Delete a Brain Gym training session record by ID.
 */
export async function deleteBrainGymSession(
  userId: string | null | undefined,
  sessionId: string
): Promise<void> {
  const currentUid = auth.currentUser?.uid || userId || 'guest_user';

  if (
    auth.currentUser &&
    auth.currentUser.uid === currentUid &&
    isValidBrainGymId(sessionId)
  ) {
    const docPath = `users/${currentUid}/brainGymSessions/${sessionId}`;
    const docRef = doc(db, 'users', currentUid, 'brainGymSessions', sessionId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  }

  const existing = loadLocalBrainGymSessions(currentUid);
  saveLocalBrainGymSessions(
    currentUid,
    existing.filter((item) => item.id !== sessionId)
  );
}

/**
 * Subscribe to the user's Brain Gym training session ledger.
 */
export function subscribeToBrainGymSessions(
  userId: string | null | undefined,
  onData: (sessions: BrainGymSessionRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const currentUid = auth.currentUser?.uid || userId;
  const initialLocal = loadLocalBrainGymSessions(currentUid);
  onData(initialLocal);

  if (!auth.currentUser || !currentUid || currentUid !== auth.currentUser.uid) {
    return () => {};
  }

  const collPath = `users/${currentUid}/brainGymSessions`;
  const collRef = collection(db, 'users', currentUid, 'brainGymSessions');
  const q = query(collRef, orderBy('createdAt', 'desc'), limit(60));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        const guestSessions = loadLocalBrainGymSessions(null);
        if (guestSessions.length > 0 && initialLocal.length === 0) {
          guestSessions.slice(0, 15).forEach((s) => {
            void recordBrainGymSession(currentUid, {
              id: s.id,
              gameId: s.gameId,
              gameTitle: s.gameTitle,
              category: s.category,
              difficulty: s.difficulty,
              score: s.score,
              accuracy: s.accuracy,
              avgReactionMs: s.avgReactionMs,
              bestReactionMs: s.bestReactionMs,
              maxSpan: s.maxSpan,
              roundsCompleted: s.roundsCompleted,
              xpEarned: s.xpEarned,
            }).catch(() => {});
          });
          onData(guestSessions);
          return;
        }
        saveLocalBrainGymSessions(currentUid, []);
        onData([]);
        return;
      }

      const cloudSessions: BrainGymSessionRecord[] = snapshot.docs.map((d) => {
        const raw = d.data();
        return {
          ...sanitizeBrainGymSessionInput({
            ...raw,
            id: d.id,
            userId: raw.userId || currentUid,
          }),
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        };
      });

      const sorted = sortBrainGymSessions(cloudSessions);
      saveLocalBrainGymSessions(currentUid, sorted);
      onData(sorted);
    },
    (error) => {
      if (onError) onError(error);
      onData(loadLocalBrainGymSessions(currentUid));
      try {
        handleFirestoreError(error, OperationType.LIST, collPath);
      } catch {
        // Logged structurally by handleFirestoreError; keep UI resilient via local cache
      }
    }
  );

  return unsubscribe;
}
