import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { CognitiveJournalEntry } from '../types';
import { JOURNAL_SAMPLE_ENTRIES } from '../data/journalTemplates';

const GUEST_STORAGE_KEY = 'mindlabz_cognitive_journals_local_v1';

function getLocalStorageKey(userId?: string | null): string {
  return userId ? `mindlabz_journals_${userId}` : GUEST_STORAGE_KEY;
}

export function loadLocalJournals(userId?: string | null): CognitiveJournalEntry[] {
  try {
    const key = getLocalStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // If guest and no storage, initialize with high-taste samples
    if (!userId || userId === 'default-user') {
      const guestRaw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (guestRaw) return JSON.parse(guestRaw);
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(JOURNAL_SAMPLE_ENTRIES));
      return JOURNAL_SAMPLE_ENTRIES;
    }
  } catch (err) {
    console.warn('Failed to load local journal cache:', err);
  }
  return [];
}

export function saveLocalJournals(userId: string | null | undefined, entries: CognitiveJournalEntry[]): void {
  try {
    const key = getLocalStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to save to local journal cache:', err);
  }
}

/**
 * Save or update a journal entry.
 * If signed in with Firebase, writes to `/users/{userId}/cognitiveJournals/{journalId}`.
 * Also synchronizes local cache.
 */
export async function saveJournalEntry(
  userId: string | null | undefined,
  entry: Omit<CognitiveJournalEntry, 'createdAt' | 'updatedAt'> & { createdAt?: any; updatedAt?: any }
): Promise<CognitiveJournalEntry> {
  const currentUid = auth.currentUser?.uid || userId;
  const entryId = entry.id || `journal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const preparedEntry: CognitiveJournalEntry = {
    ...entry,
    id: entryId,
    userId: currentUid || 'guest-user',
    time: entry.time || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    tags: Array.isArray(entry.tags) ? entry.tags.slice(0, 10) : [],
    structuredData: entry.structuredData || {},
    emotion: {
      primary: entry.emotion?.primary || '澄明通透',
      secondary: entry.emotion?.secondary || '',
      intensity: Math.min(10, Math.max(1, Number(entry.emotion?.intensity) || 5)),
      valence: entry.emotion?.valence || 'positive',
      energyLevel: Math.min(5, Math.max(1, Number(entry.emotion?.energyLevel) || 3)),
    },
    insightRating: entry.insightRating ? Math.min(5, Math.max(1, entry.insightRating)) : 5,
  };

  // 1. If signed in to Firebase Firestore, save to cloud
  if (auth.currentUser && currentUid && currentUid === auth.currentUser.uid) {
    const journalDocRef = doc(db, 'users', currentUid, 'cognitiveJournals', entryId);
    const firestorePayload: any = {
      id: entryId,
      userId: currentUid,
      date: preparedEntry.date,
      time: preparedEntry.time || '12:00',
      title: preparedEntry.title.trim().slice(0, 120),
      templateType: preparedEntry.templateType,
      emotion: {
        primary: preparedEntry.emotion.primary.slice(0, 80),
        intensity: preparedEntry.emotion.intensity,
        valence: preparedEntry.emotion.valence.slice(0, 40),
        ...(preparedEntry.emotion.secondary ? { secondary: preparedEntry.emotion.secondary.slice(0, 80) } : {}),
        ...(preparedEntry.emotion.energyLevel ? { energyLevel: preparedEntry.emotion.energyLevel } : {}),
      },
      structuredData: preparedEntry.structuredData,
      tags: preparedEntry.tags.map((t) => t.slice(0, 50)).slice(0, 10),
      ...(preparedEntry.relatedLawId ? { relatedLawId: preparedEntry.relatedLawId.slice(0, 60) } : {}),
      ...(preparedEntry.relatedLawName ? { relatedLawName: preparedEntry.relatedLawName.slice(0, 100) } : {}),
      ...(preparedEntry.insightRating ? { insightRating: preparedEntry.insightRating } : {}),
      updatedAt: serverTimestamp(),
    };

    // If existing entry has a timestamp, keep it, else set serverTimestamp
    if (!entry.createdAt || entry.createdAt === '__SERVER_TIMESTAMP__') {
      firestorePayload.createdAt = serverTimestamp();
    } else {
      firestorePayload.createdAt = entry.createdAt;
    }

    try {
      await setDoc(journalDocRef, firestorePayload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${currentUid}/cognitiveJournals/${entryId}`);
    }
  }

  // 2. Update local storage for immediate responsiveness
  const existingList = loadLocalJournals(currentUid);
  const index = existingList.findIndex((item) => item.id === entryId);
  let updatedList: CognitiveJournalEntry[];
  const finalLocalEntry = {
    ...preparedEntry,
    createdAt: preparedEntry.createdAt || nowIso,
    updatedAt: nowIso,
  };

  if (index >= 0) {
    updatedList = [...existingList];
    updatedList[index] = finalLocalEntry;
  } else {
    updatedList = [finalLocalEntry, ...existingList];
  }
  saveLocalJournals(currentUid, updatedList);

  return finalLocalEntry;
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(
  userId: string | null | undefined,
  entryId: string
): Promise<void> {
  const currentUid = auth.currentUser?.uid || userId;

  // 1. Delete from Firestore if signed in
  if (auth.currentUser && currentUid && currentUid === auth.currentUser.uid) {
    const journalDocRef = doc(db, 'users', currentUid, 'cognitiveJournals', entryId);
    try {
      await deleteDoc(journalDocRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${currentUid}/cognitiveJournals/${entryId}`);
    }
  }

  // 2. Remove from local cache
  const existingList = loadLocalJournals(currentUid);
  const updatedList = existingList.filter((item) => item.id !== entryId);
  saveLocalJournals(currentUid, updatedList);
}

/**
 * Subscribe to the user's journals in Firestore with real-time updates.
 * Falls back to local storage seamlessly.
 */
export function subscribeToJournals(
  userId: string | null | undefined,
  onData: (entries: CognitiveJournalEntry[]) => void,
  onError?: (err: any) => void
): () => void {
  const currentUid = auth.currentUser?.uid || userId;

  // Deliver cached/local data first for instant UI response
  const initialLocal = loadLocalJournals(currentUid);
  onData(initialLocal);

  // If not signed in to Firebase, just return a no-op unsubscribe
  if (!auth.currentUser || !currentUid || currentUid !== auth.currentUser.uid) {
    return () => {};
  }

  const journalsCollRef = collection(db, 'users', currentUid, 'cognitiveJournals');
  // Order by createdAt desc, fallback to date desc
  const q = query(journalsCollRef);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        // If Firestore is empty but user had local entries, save local entries to cloud
        if (initialLocal.length > 0) {
          initialLocal.forEach((loc) => {
            void saveJournalEntry(currentUid, loc);
          });
          onData(initialLocal);
        } else {
          onData([]);
        }
        return;
      }

      const entries: CognitiveJournalEntry[] = snapshot.docs.map((d) => {
        const raw = d.data();
        let createdIso = new Date().toISOString();
        if (raw.createdAt instanceof Timestamp) {
          createdIso = raw.createdAt.toDate().toISOString();
        } else if (typeof raw.createdAt === 'string') {
          createdIso = raw.createdAt;
        }

        return {
          id: d.id,
          userId: raw.userId || currentUid,
          date: raw.date || createdIso.split('T')[0],
          time: raw.time || '',
          title: raw.title || '无标题觉察手记',
          templateType: raw.templateType || 'cbt-restructure',
          emotion: {
            primary: raw.emotion?.primary || '从容平和',
            secondary: raw.emotion?.secondary || '',
            intensity: Number(raw.emotion?.intensity) || 5,
            valence: raw.emotion?.valence || 'positive',
            energyLevel: Number(raw.emotion?.energyLevel) || 3,
          },
          relatedLawId: raw.relatedLawId || undefined,
          relatedLawName: raw.relatedLawName || undefined,
          structuredData: raw.structuredData || {},
          tags: Array.isArray(raw.tags) ? raw.tags : [],
          insightRating: Number(raw.insightRating) || 5,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        };
      });

      // Sort by date/time descending
      entries.sort((a, b) => {
        const dateA = `${a.date} ${a.time || '00:00'}`;
        const dateB = `${b.date} ${b.time || '00:00'}`;
        return dateB.localeCompare(dateA);
      });

      // Update local storage
      saveLocalJournals(currentUid, entries);
      onData(entries);
    },
    (error) => {
      console.warn('Firestore journals subscription error:', error);
      if (onError) onError(error);
      // Keep showing local entries on error
      onData(loadLocalJournals(currentUid));
    }
  );

  return unsubscribe;
}
