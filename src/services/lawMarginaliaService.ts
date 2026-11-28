import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  LawMarginaliaNoteInput,
  LawMarginaliaNoteRecord,
  MarginaliaAnchorZone,
  MarginaliaHandwritingStyle,
  MarginaliaInkColor,
  MarginaliaSourceMode,
  clampMarginaliaTilt,
  isValidMarginaliaId,
  sanitizeAnchorZone,
  sanitizeHandwritingStyle,
  sanitizeInkColor,
  sanitizeLawMarginaliaInput,
  sanitizeMarginaliaContent,
  sanitizeSourceMode,
  sortMarginaliaNotes,
} from '../utils/lawMarginaliaHelpers';

const GUEST_STORAGE_KEY = 'mindlabz_law_marginalia_v1';
const MAX_LOCAL_MARGINALIA = 400;

function getLocalStorageKey(userId?: string | null): string {
  return userId && isValidMarginaliaId(userId)
    ? `mindlabz_law_marginalia_${userId}`
    : GUEST_STORAGE_KEY;
}

export function loadLocalLawMarginalia(
  userId?: string | null
): LawMarginaliaNoteRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getLocalStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const records: LawMarginaliaNoteRecord[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const sanitized = sanitizeLawMarginaliaInput({
        ...item,
        userId: userId || item.userId,
      });
      if (!sanitized) continue;
      records.push({
        ...sanitized,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      });
    }
    return sortMarginaliaNotes(records);
  } catch (err) {
    console.warn('Failed to load local law marginalia:', err);
    return [];
  }
}

export function saveLocalLawMarginalia(
  userId: string | null | undefined,
  notes: LawMarginaliaNoteRecord[]
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getLocalStorageKey(userId),
      JSON.stringify(notes.slice(0, MAX_LOCAL_MARGINALIA))
    );
  } catch (err) {
    console.warn('Failed to save local law marginalia:', err);
  }
}

/**
 * Create a new handwritten-style marginalia note on a specific book page.
 * Persists to `/users/{userId}/lawMarginalia/{noteId}` when signed in and caches locally.
 */
export async function createLawMarginaliaNote(
  userId: string | null | undefined,
  input: Omit<LawMarginaliaNoteInput, 'userId'>
): Promise<LawMarginaliaNoteRecord> {
  const currentUid = auth.currentUser?.uid || userId || 'guest_user';
  const prepared = sanitizeLawMarginaliaInput({
    ...input,
    userId: currentUid,
  });
  if (!prepared) {
    throw new Error('Marginalia note requires valid lawId and non-empty content.');
  }

  const nowIso = new Date().toISOString();

  if (auth.currentUser && auth.currentUser.uid === currentUid) {
    const docPath = `users/${currentUid}/lawMarginalia/${prepared.id}`;
    const docRef = doc(db, 'users', currentUid, 'lawMarginalia', prepared.id);
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

  const localRecord: LawMarginaliaNoteRecord = {
    ...prepared,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const existing = loadLocalLawMarginalia(currentUid);
  const next = sortMarginaliaNotes([
    localRecord,
    ...existing.filter((item) => item.id !== prepared.id),
  ]);
  saveLocalLawMarginalia(currentUid, next);
  return localRecord;
}

export interface LawMarginaliaUpdatePatch {
  content?: string;
  inkColor?: MarginaliaInkColor;
  handwritingStyle?: MarginaliaHandwritingStyle;
  anchorZone?: MarginaliaAnchorZone;
  tiltDeg?: number;
  sourceMode?: MarginaliaSourceMode;
}

/**
 * Update an existing marginalia note while keeping `id`, `userId`, `lawId`, `pageIndex`,
 * and `createdAt` strictly immutable as required by `firestore.rules`.
 */
export async function updateLawMarginaliaNote(
  userId: string | null | undefined,
  existingNote: LawMarginaliaNoteRecord,
  patch: LawMarginaliaUpdatePatch
): Promise<LawMarginaliaNoteRecord> {
  const currentUid = auth.currentUser?.uid || userId || 'guest_user';
  const nextContent =
    patch.content !== undefined
      ? sanitizeMarginaliaContent(patch.content)
      : existingNote.content;

  if (!nextContent) {
    throw new Error('Marginalia content cannot be empty.');
  }

  const allowedUpdateFields = {
    content: nextContent,
    inkColor:
      patch.inkColor !== undefined
        ? sanitizeInkColor(patch.inkColor)
        : existingNote.inkColor,
    handwritingStyle:
      patch.handwritingStyle !== undefined
        ? sanitizeHandwritingStyle(patch.handwritingStyle)
        : existingNote.handwritingStyle,
    anchorZone:
      patch.anchorZone !== undefined
        ? sanitizeAnchorZone(patch.anchorZone)
        : existingNote.anchorZone,
    tiltDeg:
      patch.tiltDeg !== undefined
        ? clampMarginaliaTilt(patch.tiltDeg, existingNote.id)
        : existingNote.tiltDeg,
    sourceMode:
      patch.sourceMode !== undefined
        ? sanitizeSourceMode(patch.sourceMode)
        : existingNote.sourceMode,
  };

  if (
    auth.currentUser &&
    auth.currentUser.uid === currentUid &&
    isValidMarginaliaId(existingNote.id)
  ) {
    const docPath = `users/${currentUid}/lawMarginalia/${existingNote.id}`;
    const docRef = doc(db, 'users', currentUid, 'lawMarginalia', existingNote.id);
    try {
      await updateDoc(docRef, {
        ...allowedUpdateFields,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  }

  const nowIso = new Date().toISOString();
  const updatedRecord: LawMarginaliaNoteRecord = {
    ...existingNote,
    ...allowedUpdateFields,
    updatedAt: nowIso,
  };

  const existing = loadLocalLawMarginalia(currentUid);
  const next = sortMarginaliaNotes(
    existing.map((item) => (item.id === existingNote.id ? updatedRecord : item))
  );
  saveLocalLawMarginalia(currentUid, next);
  return updatedRecord;
}

/**
 * Delete a marginalia note from Firestore (if signed in) and local storage.
 */
export async function deleteLawMarginaliaNote(
  userId: string | null | undefined,
  noteId: string
): Promise<void> {
  const currentUid = auth.currentUser?.uid || userId || 'guest_user';

  if (
    auth.currentUser &&
    auth.currentUser.uid === currentUid &&
    isValidMarginaliaId(noteId)
  ) {
    const docPath = `users/${currentUid}/lawMarginalia/${noteId}`;
    const docRef = doc(db, 'users', currentUid, 'lawMarginalia', noteId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  }

  const existing = loadLocalLawMarginalia(currentUid);
  saveLocalLawMarginalia(
    currentUid,
    existing.filter((item) => item.id !== noteId)
  );
}

/**
 * Subscribe to marginalia notes for a specific psychology law.
 * Automatically promotes guest local marginalia for that law into Firestore on login.
 */
export function subscribeToLawMarginalia(
  userId: string | null | undefined,
  lawId: string,
  onData: (notes: LawMarginaliaNoteRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const currentUid = auth.currentUser?.uid || userId;
  const initialLocalForLaw = loadLocalLawMarginalia(currentUid).filter(
    (note) => note.lawId === lawId
  );
  onData(initialLocalForLaw);

  if (
    !auth.currentUser ||
    !currentUid ||
    currentUid !== auth.currentUser.uid ||
    !isValidMarginaliaId(lawId)
  ) {
    return () => {};
  }

  const collPath = `users/${currentUid}/lawMarginalia`;
  const collRef = collection(db, 'users', currentUid, 'lawMarginalia');
  const q = query(collRef, where('lawId', '==', lawId));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        const guestNotesForLaw = loadLocalLawMarginalia(null).filter(
          (note) => note.lawId === lawId
        );
        if (guestNotesForLaw.length > 0 && initialLocalForLaw.length === 0) {
          guestNotesForLaw.forEach((note) => {
            void createLawMarginaliaNote(currentUid, {
              id: note.id,
              lawId: note.lawId,
              pageIndex: note.pageIndex,
              content: note.content,
              inkColor: note.inkColor,
              handwritingStyle: note.handwritingStyle,
              anchorZone: note.anchorZone,
              tiltDeg: note.tiltDeg,
              sourceMode: note.sourceMode,
            }).catch(() => {});
          });
          onData(guestNotesForLaw);
          return;
        }
        const otherLawNotes = loadLocalLawMarginalia(currentUid).filter(
          (note) => note.lawId !== lawId
        );
        saveLocalLawMarginalia(currentUid, otherLawNotes);
        onData([]);
        return;
      }

      const cloudNotes: LawMarginaliaNoteRecord[] = [];
      snapshot.docs.forEach((d) => {
        const raw = d.data();
        const sanitized = sanitizeLawMarginaliaInput({
          id: d.id,
          userId: raw.userId || currentUid,
          lawId: raw.lawId || lawId,
          pageIndex: raw.pageIndex,
          content: raw.content,
          inkColor: raw.inkColor,
          handwritingStyle: raw.handwritingStyle,
          anchorZone: raw.anchorZone,
          tiltDeg: raw.tiltDeg,
          sourceMode: raw.sourceMode,
        });
        if (!sanitized) return;
        cloudNotes.push({
          ...sanitized,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        });
      });

      const sortedForLaw = sortMarginaliaNotes(cloudNotes);
      const otherLawNotes = loadLocalLawMarginalia(currentUid).filter(
        (note) => note.lawId !== lawId
      );
      saveLocalLawMarginalia(currentUid, sortMarginaliaNotes([...sortedForLaw, ...otherLawNotes]));
      onData(sortedForLaw);
    },
    (error) => {
      if (onError) onError(error);
      onData(
        loadLocalLawMarginalia(currentUid).filter((note) => note.lawId === lawId)
      );
      try {
        handleFirestoreError(error, OperationType.LIST, collPath);
      } catch {
        // Logged by handleFirestoreError; local cache keeps reader operational
      }
    }
  );

  return unsubscribe;
}
