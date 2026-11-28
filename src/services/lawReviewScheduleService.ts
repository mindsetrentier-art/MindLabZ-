import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { isValidPageBookmarkId } from '../utils/lawReadingBookmarkHelpers';
import {
  LawReviewScheduleInput,
  LawReviewScheduleRecord,
  RecallRating,
  SanitizedLawReviewSchedule,
  computeNextSpacedReview,
  sanitizeLawReviewScheduleInput,
  sortReviewSchedules,
} from '../utils/lawSpacedRepetition';

const GUEST_STORAGE_KEY = 'mindlabz_law_review_schedules_v1';
const MAX_LOCAL_SCHEDULES = 300;

function getLocalStorageKey(userId?: string | null): string {
  return userId && isValidPageBookmarkId(userId)
    ? `mindlabz_law_review_schedules_${userId}`
    : GUEST_STORAGE_KEY;
}

export function loadLocalReviewSchedules(
  userId?: string | null
): LawReviewScheduleRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getLocalStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const results: LawReviewScheduleRecord[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const sanitized = sanitizeLawReviewScheduleInput({
        ...item,
        userId: userId || item.userId,
      });
      if (!sanitized) continue;
      results.push({
        ...sanitized,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      });
    }
    return sortReviewSchedules(results);
  } catch (err) {
    console.warn('Failed to load local review schedules:', err);
    return [];
  }
}

export function saveLocalReviewSchedules(
  userId: string | null | undefined,
  schedules: LawReviewScheduleRecord[]
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getLocalStorageKey(userId),
      JSON.stringify(schedules.slice(0, MAX_LOCAL_SCHEDULES))
    );
  } catch (err) {
    console.warn('Failed to save local review schedules:', err);
  }
}

export async function upsertLawReviewSchedule(
  userId: string | null | undefined,
  input: LawReviewScheduleInput
): Promise<LawReviewScheduleRecord> {
  const currentUid = auth.currentUser?.uid || userId || 'guest_user';
  const prepared = sanitizeLawReviewScheduleInput({
    ...input,
    userId: currentUid,
  });
  if (!prepared) {
    throw new Error('Invalid law review schedule payload.');
  }

  const nowIso = new Date().toISOString();
  const existingLocal = loadLocalReviewSchedules(currentUid).find(
    (s) => s.lawId === prepared.lawId
  );

  if (auth.currentUser && auth.currentUser.uid === currentUid) {
    const docPath = `users/${currentUid}/lawReviewSchedules/${prepared.lawId}`;
    const docRef = doc(db, 'users', currentUid, 'lawReviewSchedules', prepared.lawId);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, {
          lawNameZh: prepared.lawNameZh,
          lawNameEn: prepared.lawNameEn,
          categoryZh: prepared.categoryZh,
          easeFactor: prepared.easeFactor,
          intervalDays: prepared.intervalDays,
          repetitions: prepared.repetitions,
          lapses: prepared.lapses,
          totalReviews: prepared.totalReviews,
          lastRating: prepared.lastRating,
          nextReviewAtMs: prepared.nextReviewAtMs,
          lastReviewedAtMs: prepared.lastReviewedAtMs,
          snoozedUntilMs: prepared.snoozedUntilMs,
          notificationsEnabled: prepared.notificationsEnabled,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(docRef, {
          ...prepared,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  const localRecord: LawReviewScheduleRecord = {
    ...prepared,
    createdAt: existingLocal?.createdAt || nowIso,
    updatedAt: nowIso,
  };
  const allLocal = loadLocalReviewSchedules(currentUid);
  const nextLocal = sortReviewSchedules([
    localRecord,
    ...allLocal.filter((item) => item.lawId !== prepared.lawId),
  ]);
  saveLocalReviewSchedules(currentUid, nextLocal);
  return localRecord;
}

export async function submitLawSpacedReview(
  userId: string | null | undefined,
  currentSchedule: SanitizedLawReviewSchedule,
  rating: RecallRating,
  nowMs: number = Date.now()
): Promise<LawReviewScheduleRecord> {
  const nextState = computeNextSpacedReview(currentSchedule, rating, nowMs);
  return upsertLawReviewSchedule(userId, nextState);
}

export async function snoozeLawReviewSchedule(
  userId: string | null | undefined,
  currentSchedule: SanitizedLawReviewSchedule,
  snoozeMs: number,
  nowMs: number = Date.now()
): Promise<LawReviewScheduleRecord> {
  return upsertLawReviewSchedule(userId, {
    ...currentSchedule,
    snoozedUntilMs: nowMs + Math.max(60_000, snoozeMs),
  });
}

export async function setLawReviewNotificationPreference(
  userId: string | null | undefined,
  currentSchedule: SanitizedLawReviewSchedule,
  notificationsEnabled: boolean
): Promise<LawReviewScheduleRecord> {
  return upsertLawReviewSchedule(userId, {
    ...currentSchedule,
    notificationsEnabled,
  });
}

export async function deleteLawReviewSchedule(
  userId: string | null | undefined,
  lawId: string
): Promise<void> {
  const currentUid = auth.currentUser?.uid || userId || 'guest_user';

  if (
    auth.currentUser &&
    auth.currentUser.uid === currentUid &&
    isValidPageBookmarkId(lawId)
  ) {
    const docPath = `users/${currentUid}/lawReviewSchedules/${lawId}`;
    const docRef = doc(db, 'users', currentUid, 'lawReviewSchedules', lawId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  }

  const allLocal = loadLocalReviewSchedules(currentUid);
  saveLocalReviewSchedules(
    currentUid,
    allLocal.filter((item) => item.lawId !== lawId)
  );
}

export function subscribeToLawReviewSchedules(
  userId: string | null | undefined,
  onData: (schedules: LawReviewScheduleRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const currentUid = auth.currentUser?.uid || userId;
  const initialLocal = loadLocalReviewSchedules(currentUid);
  onData(initialLocal);

  if (!auth.currentUser || !currentUid || currentUid !== auth.currentUser.uid) {
    return () => {};
  }

  const collPath = `users/${currentUid}/lawReviewSchedules`;
  const collRef = collection(db, 'users', currentUid, 'lawReviewSchedules');
  const q = query(collRef);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        const guestSchedules = loadLocalReviewSchedules(null);
        if (guestSchedules.length > 0 && initialLocal.length === 0) {
          guestSchedules.forEach((sched) => {
            void upsertLawReviewSchedule(currentUid, sched).catch(() => {});
          });
          onData(guestSchedules);
          return;
        }
        saveLocalReviewSchedules(currentUid, []);
        onData([]);
        return;
      }

      const cloudSchedules: LawReviewScheduleRecord[] = [];
      snapshot.docs.forEach((d) => {
        const raw = d.data();
        const sanitized = sanitizeLawReviewScheduleInput({
          id: d.id,
          userId: raw.userId || currentUid,
          lawId: raw.lawId || d.id,
          lawNameZh: raw.lawNameZh,
          lawNameEn: raw.lawNameEn,
          categoryZh: raw.categoryZh,
          easeFactor: raw.easeFactor,
          intervalDays: raw.intervalDays,
          repetitions: raw.repetitions,
          lapses: raw.lapses,
          totalReviews: raw.totalReviews,
          lastRating: raw.lastRating,
          nextReviewAtMs: raw.nextReviewAtMs,
          lastReviewedAtMs: raw.lastReviewedAtMs,
          snoozedUntilMs: raw.snoozedUntilMs,
          notificationsEnabled: raw.notificationsEnabled,
        });
        if (!sanitized) return;
        cloudSchedules.push({
          ...sanitized,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        });
      });

      const sorted = sortReviewSchedules(cloudSchedules);
      saveLocalReviewSchedules(currentUid, sorted);
      onData(sorted);
    },
    (error) => {
      if (onError) onError(error);
      onData(loadLocalReviewSchedules(currentUid));
      try {
        handleFirestoreError(error, OperationType.LIST, collPath);
      } catch {
        // Logged by handleFirestoreError; keep UI resilient via local cache
      }
    }
  );

  return unsubscribe;
}
