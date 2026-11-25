export interface CachedAudioChunkRecord {
  cacheKey: string;
  preset: string;
  text: string;
  mimeType: string;
  blob: Blob;
  sizeBytes: number;
  updatedAt: number;
}

export interface OfflineLawManifest {
  lawId: string;
  lawTitle: string;
  preset: string;
  chunkKeys: string[];
  totalBytes: number;
  cachedAt: number;
}

const DB_NAME = 'mindlabz_offline_tts_v1';
const DB_VERSION = 1;
const STORE_CHUNKS = 'audio_chunks';
const STORE_MANIFESTS = 'law_manifests';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openOfflineAudioDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_CHUNKS)) {
          db.createObjectStore(STORE_CHUNKS, { keyPath: 'cacheKey' });
        }
        if (!db.objectStoreNames.contains(STORE_MANIFESTS)) {
          db.createObjectStore(STORE_MANIFESTS, { keyPath: 'lawId' });
        }
      };

      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };

      req.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

export function buildTtsCacheKey(preset: string, spokenText: string): string {
  return `${preset}::${spokenText}`;
}

export async function getOfflineChunkBlob(cacheKey: string): Promise<Blob | null> {
  const db = await openOfflineAudioDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CHUNKS, 'readonly');
      const store = tx.objectStore(STORE_CHUNKS);
      const req = store.get(cacheKey);
      req.onsuccess = () => {
        const rec = req.result as CachedAudioChunkRecord | undefined;
        resolve(rec?.blob instanceof Blob ? rec.blob : null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function hasOfflineChunk(cacheKey: string): Promise<boolean> {
  const db = await openOfflineAudioDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CHUNKS, 'readonly');
      const store = tx.objectStore(STORE_CHUNKS);
      const req = store.getKey(cacheKey);
      req.onsuccess = () => resolve(Boolean(req.result));
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function putOfflineChunkBlob(record: CachedAudioChunkRecord): Promise<boolean> {
  const db = await openOfflineAudioDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CHUNKS, 'readwrite');
      const store = tx.objectStore(STORE_CHUNKS);
      store.put(record);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function putOfflineLawManifest(manifest: OfflineLawManifest): Promise<boolean> {
  const db = await openOfflineAudioDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_MANIFESTS, 'readwrite');
      const store = tx.objectStore(STORE_MANIFESTS);
      store.put(manifest);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function getAllOfflineLawManifests(): Promise<OfflineLawManifest[]> {
  const db = await openOfflineAudioDb();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_MANIFESTS, 'readonly');
      const store = tx.objectStore(STORE_MANIFESTS);
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = Array.isArray(req.result) ? (req.result as OfflineLawManifest[]) : [];
        resolve(rows);
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function getOfflineCacheStats(): Promise<{
  chunkCount: number;
  totalBytes: number;
  manifests: OfflineLawManifest[];
}> {
  const db = await openOfflineAudioDb();
  if (!db) return { chunkCount: 0, totalBytes: 0, manifests: [] };

  const manifests = await getAllOfflineLawManifests();

  const chunkStats = await new Promise<{ chunkCount: number; totalBytes: number }>((resolve) => {
    try {
      const tx = db.transaction(STORE_CHUNKS, 'readonly');
      const store = tx.objectStore(STORE_CHUNKS);
      let chunkCount = 0;
      let totalBytes = 0;
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) {
          resolve({ chunkCount, totalBytes });
          return;
        }
        const val = cursor.value as CachedAudioChunkRecord | undefined;
        chunkCount += 1;
        totalBytes += typeof val?.sizeBytes === 'number' ? val.sizeBytes : val?.blob?.size || 0;
        cursor.continue();
      };
      cursorReq.onerror = () => resolve({ chunkCount, totalBytes });
    } catch {
      resolve({ chunkCount: 0, totalBytes: 0 });
    }
  });

  return {
    chunkCount: chunkStats.chunkCount,
    totalBytes: chunkStats.totalBytes,
    manifests,
  };
}

export async function removeOfflineLawCache(lawId: string): Promise<void> {
  const db = await openOfflineAudioDb();
  if (!db) return;

  const manifests = await getAllOfflineLawManifests();
  const target = manifests.find((m) => m.lawId === lawId);
  if (!target) return;

  // Keep chunks still referenced by any other law manifest
  const retainedKeys = new Set<string>();
  for (const m of manifests) {
    if (m.lawId !== lawId) {
      for (const k of m.chunkKeys) retainedKeys.add(k);
    }
  }

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction([STORE_MANIFESTS, STORE_CHUNKS], 'readwrite');
      tx.objectStore(STORE_MANIFESTS).delete(lawId);
      const chunkStore = tx.objectStore(STORE_CHUNKS);
      for (const key of target.chunkKeys) {
        if (!retainedKeys.has(key)) {
          chunkStore.delete(key);
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function clearAllOfflineAudioCache(): Promise<void> {
  const db = await openOfflineAudioDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction([STORE_MANIFESTS, STORE_CHUNKS], 'readwrite');
      tx.objectStore(STORE_MANIFESTS).clear();
      tx.objectStore(STORE_CHUNKS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function formatAudioCacheBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
