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
import {
  LawPageBookmarkInput,
  LawPageBookmarkRecord,
  buildProgressBookmarkId,
  generatePagePinBookmarkId,
  isValidPageBookmarkId,
  sanitizeLawPageBookmarkInput,
  sortLawPageBookmarks,
} from '../utils/lawReadingBookmarkHelpers';

const GUEST_STORAGE_KEY = 'mindlabz_law_page_bookmarks_v1';
const MAX_LOCAL_BOOKMARKS = 300;

function getLocalStorageKey(userId?: string | null): string {
  return userId && isValidPageBookmarkId(userId)
    ? `mindlabz_law_page_bookmarks_${userId}`
    : GUEST_STORAGE_KEY;
}

export function loadLocalLawPageBookmarks(
  userId?: string | null
): LawPageBookmarkRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getLocalStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const results: LawPageBookmarkRecord[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const sanitized = sanitizeLawPageBookmarkInput({
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
    return sortLawPageBookmarks(results);
  } catch (err) {
    console.warn('Failed to load local law page bookmarks:', err);
    return [];
  }
}

export function saveLocalLawPageBookmarks(
  userId: string | null | undefined,
  bookmarks: LawPageBookmarkRecord[]
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getLocalStorageKey(userId),
      JSON.stringify(bookmarks.slice(0, MAX_LOCAL_BOOKMARKS))
    );
  } catch (err) {
    console.warn('Failed to save local law page bookmarks:', err);
  }
}

/**
 * Save or update the continuous reading-progress bookmark (`prog_{lawId}`) for a law.
 * Respects `createdAt` immutability on Firestore updates.
 */
export async function saveReadingProgressBookmark(
  userId: string | null | undefined,
  input: Omit<LawPageBookmarkInput, 'id' | 'userId' | 'bookmarkKind'>
): Promise<LawPageBookmarkRecord> {
  const currentUid = auth.currentUser?.uid || userId || 'guest_user';
  const progressId = buildProgressBookmarkId(input.lawId);
  const prepared = sanitizeLawPageBookmarkInput({
    ...input,
    id: progressId,
    userId: currentUid,
    bookmarkKind: 'progress',
  });
  if (!prepared) {
    throw new Error('Invalid reading progress bookmark payload.');
  }

  const nowIso = new Date().toISOString();
  const existingLocal = loadLocalLawPageBookmarks(currentUid).find(
    (b) => b.id === progressId
  );

  if (auth.currentUser && auth.currentUser.uid === currentUid) {
    const docPath = `users/${currentUid}/lawPageBookmarks/${progressId}`;
    const docRef = doc(db, 'users', currentUid, 'lawPageBookmarks', progressId);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, {
          pageIndex: prepared.pageIndex,
          pageTitle: prepared.pageTitle,
          note: prepared.note,
          lawNameZh: prepared.lawNameZh,
          lawNameEn: prepared.lawNameEn,
          categoryZh: prepared.categoryZh,
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

  const localRecord: LawPageBookmarkRecord = {
    ...prepared,
    createdAt: existingLocal?.createdAt || nowIso,
    updatedAt: nowIso,
  };
  const allLocal = loadLocalLawPageBookmarks(currentUid);
  const nextLocal = sortLawPageBookmarks([
    localRecord,
    ...allLocal.filter((b) => b.id !== progressId),
  ]);
  saveLocalLawPageBookmarks(currentUid, nextLocal);
  return localRecord;
}

/**
 * Create a specific pinned page bookmark (`page-pin`) inside a law book.
 */
export async function createPagePinBookmark(
  userId: string | null | undefined,
  input: Omit<LawPageBookmarkInput, 'userId' | 'bookmarkKind'>
): Promise<LawPageBookmarkRecord> {
  const currentUid = auth.currentUser?.uid || userId || 'guest_user';
  const pinId = isValidPageBookmarkId(input.id)
    ? input.id
    : generatePagePinBookmarkId();
  const prepared = sanitizeLawPageBookmarkInput({
    ...input,
    id: pinId,
    userId: currentUid,
    bookmarkKind: 'page-pin',
  });
  if (!prepared) {
    throw new Error('Invalid page bookmark payload.');
  }

  const nowIso = new Date().toISOString();

  if (auth.currentUser && auth.currentUser.uid === currentUid) {
    const docPath = `users/${currentUid}/lawPageBookmarks/${pinId}`;
    const docRef = doc(db, 'users', currentUid, 'lawPageBookmarks', pinId);
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

  const localRecord: LawPageBookmarkRecord = {
    ...prepared,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const allLocal = loadLocalLawPageBookmarks(currentUid);
  const nextLocal = sortLawPageBookmarks([
    localRecord,
    ...allLocal.filter((b) => b.id !== pinId),
  ]);
  saveLocalLawPageBookmarks(currentUid, nextLocal);
  return localRecord;
}

/**
 * Delete any saved reading progress or specific page bookmark.
 */
export async function deleteLawPageBookmark(
  userId: string | null | undefined,
  bookmarkId: string
): Promise<void> {
  const currentUid = auth.currentUser?.uid || userId || 'guest_user';

  if (
    auth.currentUser &&
    auth.currentUser.uid === currentUid &&
    isValidPageBookmarkId(bookmarkId)
  ) {
    const docPath = `users/${currentUid}/lawPageBookmarks/${bookmarkId}`;
    const docRef = doc(db, 'users', currentUid, 'lawPageBookmarks', bookmarkId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  }

  const allLocal = loadLocalLawPageBookmarks(currentUid);
  saveLocalLawPageBookmarks(
    currentUid,
    allLocal.filter((b) => b.id !== bookmarkId)
  );
}

/**
 * Subscribe to all saved reading progress markers & page bookmarks for the active user.
 * Automatically migrates guest bookmarks into cloud storage once upon first empty cloud snapshot.
 */
export function subscribeToAllLawPageBookmarks(
  userId: string | null | undefined,
  onData: (bookmarks: LawPageBookmarkRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const currentUid = auth.currentUser?.uid || userId;
  const initialLocal = loadLocalLawPageBookmarks(currentUid);
  onData(initialLocal);

  if (!auth.currentUser || !currentUid || currentUid !== auth.currentUser.uid) {
    return () => {};
  }

  const collPath = `users/${currentUid}/lawPageBookmarks`;
  const collRef = collection(db, 'users', currentUid, 'lawPageBookmarks');
  const q = query(collRef);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        const guestBookmarks = loadLocalLawPageBookmarks(null);
        if (guestBookmarks.length > 0 && initialLocal.length === 0) {
          guestBookmarks.forEach((bm) => {
            if (bm.bookmarkKind === 'progress') {
              void saveReadingProgressBookmark(currentUid, {
                lawId: bm.lawId,
                lawNameZh: bm.lawNameZh,
                lawNameEn: bm.lawNameEn,
                categoryZh: bm.categoryZh,
                pageIndex: bm.pageIndex,
                pageTitle: bm.pageTitle,
                note: bm.note,
              }).catch(() => {});
            } else {
              void createPagePinBookmark(currentUid, {
                id: bm.id,
                lawId: bm.lawId,
                lawNameZh: bm.lawNameZh,
                lawNameEn: bm.lawNameEn,
                categoryZh: bm.categoryZh,
                pageIndex: bm.pageIndex,
                pageTitle: bm.pageTitle,
                note: bm.note,
              }).catch(() => {});
            }
          });
          onData(guestBookmarks);
          return;
        }
        saveLocalLawPageBookmarks(currentUid, []);
        onData([]);
        return;
      }

      const cloudBookmarks: LawPageBookmarkRecord[] = [];
      snapshot.docs.forEach((d) => {
        const raw = d.data();
        const sanitized = sanitizeLawPageBookmarkInput({
          id: d.id,
          userId: raw.userId || currentUid,
          lawId: raw.lawId,
          lawNameZh: raw.lawNameZh,
          lawNameEn: raw.lawNameEn,
          categoryZh: raw.categoryZh,
          pageIndex: raw.pageIndex,
          pageTitle: raw.pageTitle,
          bookmarkKind: raw.bookmarkKind,
          note: raw.note,
        });
        if (!sanitized) return;
        cloudBookmarks.push({
          ...sanitized,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        });
      });

      const sorted = sortLawPageBookmarks(cloudBookmarks);
      saveLocalLawPageBookmarks(currentUid, sorted);
      onData(sorted);
    },
    (error) => {
      if (onError) onError(error);
      onData(loadLocalLawPageBookmarks(currentUid));
      try {
        handleFirestoreError(error, OperationType.LIST, collPath);
      } catch {
        // Logged by handleFirestoreError; keep UI resilient via local cache
      }
    }
  );

  return unsubscribe;
}
