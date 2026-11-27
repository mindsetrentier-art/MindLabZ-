import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  FocusSessionBookmark,
  FocusSessionBookmarkInput,
  sanitizeBookmarkLabel,
} from '../utils/cognitiveFocusAudio';
import {
  sanitizeFocusBookmarkInput,
  sortFocusBookmarks,
  isValidFirestoreId,
} from '../utils/focusBookmarkHelpers';

const GUEST_STORAGE_KEY = 'mindlabz_focus_session_bookmarks_v1';
const MAX_LOCAL_BOOKMARKS = 100;

function getLocalStorageKey(userId?: string | null): string {
  return userId && isValidFirestoreId(userId)
    ? `mindlabz_focus_bookmarks_${userId}`
    : GUEST_STORAGE_KEY;
}

export function loadLocalFocusBookmarks(
  userId?: string | null
): FocusSessionBookmark[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getLocalStorageKey(userId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortFocusBookmarks(
      parsed
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          ...sanitizeFocusBookmarkInput({ ...item, userId: userId || item.userId }),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        }))
    );
  } catch (err) {
    console.warn('Failed to load local focus bookmarks:', err);
    return [];
  }
}

export function saveLocalFocusBookmarks(
  userId: string | null | undefined,
  bookmarks: FocusSessionBookmark[]
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getLocalStorageKey(userId);
    window.localStorage.setItem(
      key,
      JSON.stringify(bookmarks.slice(0, MAX_LOCAL_BOOKMARKS))
    );
  } catch (err) {
    console.warn('Failed to save local focus bookmarks:', err);
  }
}

/**
 * Create a new focus session timestamp bookmark.
 * Persists to `/users/{userId}/focusSessionBookmarks/{bookmarkId}` when signed in,
 * and always synchronizes local storage for instant availability.
 */
export async function createFocusBookmark(
  userId: string | null | undefined,
  input: Omit<FocusSessionBookmarkInput, 'id' | 'userId'> & { id?: string }
): Promise<FocusSessionBookmark> {
  const currentUid = auth.currentUser?.uid || userId || 'guest_user';
  const prepared = sanitizeFocusBookmarkInput({
    ...input,
    userId: currentUid,
  });
  const nowIso = new Date().toISOString();

  if (auth.currentUser && auth.currentUser.uid === currentUid) {
    const docPath = `users/${currentUid}/focusSessionBookmarks/${prepared.id}`;
    const docRef = doc(db, 'users', currentUid, 'focusSessionBookmarks', prepared.id);
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

  const localBookmark: FocusSessionBookmark = {
    ...prepared,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const existing = loadLocalFocusBookmarks(currentUid);
  const next = sortFocusBookmarks([
    localBookmark,
    ...existing.filter((item) => item.id !== prepared.id),
  ]);
  saveLocalFocusBookmarks(currentUid, next);
  return localBookmark;
}

/**
 * Rename an existing focus session bookmark label.
 */
export async function renameFocusBookmark(
  userId: string | null | undefined,
  bookmarkId: string,
  nextLabel: string
): Promise<void> {
  const currentUid = auth.currentUser?.uid || userId || 'guest_user';
  const safeLabel = sanitizeBookmarkLabel(nextLabel);

  if (
    auth.currentUser &&
    auth.currentUser.uid === currentUid &&
    isValidFirestoreId(bookmarkId)
  ) {
    const docPath = `users/${currentUid}/focusSessionBookmarks/${bookmarkId}`;
    const docRef = doc(db, 'users', currentUid, 'focusSessionBookmarks', bookmarkId);
    try {
      await updateDoc(docRef, {
        label: safeLabel,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  }

  const existing = loadLocalFocusBookmarks(currentUid);
  const nowIso = new Date().toISOString();
  const next = existing.map((item) =>
    item.id === bookmarkId
      ? { ...item, label: safeLabel, updatedAt: nowIso }
      : item
  );
  saveLocalFocusBookmarks(currentUid, next);
}

/**
 * Delete a focus session timestamp bookmark.
 */
export async function deleteFocusBookmark(
  userId: string | null | undefined,
  bookmarkId: string
): Promise<void> {
  const currentUid = auth.currentUser?.uid || userId || 'guest_user';

  if (
    auth.currentUser &&
    auth.currentUser.uid === currentUid &&
    isValidFirestoreId(bookmarkId)
  ) {
    const docPath = `users/${currentUid}/focusSessionBookmarks/${bookmarkId}`;
    const docRef = doc(db, 'users', currentUid, 'focusSessionBookmarks', bookmarkId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  }

  const existing = loadLocalFocusBookmarks(currentUid);
  saveLocalFocusBookmarks(
    currentUid,
    existing.filter((item) => item.id !== bookmarkId)
  );
}

/**
 * Subscribe to the user's focus session timestamp bookmarks.
 * Migrates any guest bookmarks into cloud storage once upon first empty cloud snapshot.
 */
export function subscribeToFocusBookmarks(
  userId: string | null | undefined,
  onData: (bookmarks: FocusSessionBookmark[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const currentUid = auth.currentUser?.uid || userId;
  const initialLocal = loadLocalFocusBookmarks(currentUid);
  onData(initialLocal);

  if (!auth.currentUser || !currentUid || currentUid !== auth.currentUser.uid) {
    return () => {};
  }

  const collPath = `users/${currentUid}/focusSessionBookmarks`;
  const collRef = collection(db, 'users', currentUid, 'focusSessionBookmarks');
  const q = query(collRef);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        const guestBookmarks = loadLocalFocusBookmarks(null);
        if (guestBookmarks.length > 0 && initialLocal.length === 0) {
          // Promote guest bookmarks into the signed-in user's cloud subcollection once
          guestBookmarks.forEach((bm) => {
            void createFocusBookmark(currentUid, {
              id: bm.id,
              label: bm.label,
              timestampSec: bm.timestampSec,
              binauralPresetId: bm.binauralPresetId,
              naturePresetId: bm.naturePresetId,
              beatHz: bm.beatHz,
              carrierHz: bm.carrierHz,
              binauralMix: bm.binauralMix,
              natureMix: bm.natureMix,
              masterVolume: bm.masterVolume,
              timerDurationSec: bm.timerDurationSec,
            }).catch(() => {});
          });
          onData(guestBookmarks);
          return;
        }
        saveLocalFocusBookmarks(currentUid, []);
        onData([]);
        return;
      }

      const cloudBookmarks: FocusSessionBookmark[] = snapshot.docs.map((d) => {
        const raw = d.data();
        return {
          ...sanitizeFocusBookmarkInput({
            ...raw,
            id: d.id,
            userId: raw.userId || currentUid,
          }),
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        };
      });

      const sorted = sortFocusBookmarks(cloudBookmarks);
      saveLocalFocusBookmarks(currentUid, sorted);
      onData(sorted);
    },
    (error) => {
      if (onError) onError(error);
      onData(loadLocalFocusBookmarks(currentUid));
      try {
        handleFirestoreError(error, OperationType.LIST, collPath);
      } catch {
        // Logged by handleFirestoreError; keep UI resilient via local cache
      }
    }
  );

  return unsubscribe;
}
