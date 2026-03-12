/**
 * IndexedDB-backed image storage.
 *
 * Keeps heavy base64 data URLs out of localStorage (5-10 MB cap)
 * by storing them in IndexedDB (effectively unlimited).
 *
 * Keys follow the pattern  `{brochureId}:{field}`
 * e.g. "abc-123:heroImageUrl"
 */

const DB_NAME = 'print-pdf-images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveImage(key: string, dataUrl: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(dataUrl, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadImage(key: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as string) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteImage(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Delete all images whose key starts with the given prefix (e.g. a brochure ID). */
export async function deleteImagesByPrefix(prefix: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      if (typeof cursor.key === 'string' && cursor.key.startsWith(prefix)) {
        cursor.delete();
      }
      cursor.continue();
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Copy all images from one brochure ID prefix to another. */
export async function copyImages(
  sourceId: string,
  targetId: string,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    const writes: Promise<void>[] = [];

    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      if (typeof cursor.key === 'string' && cursor.key.startsWith(`${sourceId}:`)) {
        const field = cursor.key.slice(sourceId.length); // includes the ":"
        store.put(cursor.value, `${targetId}${field}`);
      }
      cursor.continue();
    };
    tx.oncomplete = () => {
      Promise.all(writes).then(() => resolve());
    };
    tx.onerror = () => reject(tx.error);
  });
}

/** The fields in BrochureData that hold large image data URLs. */
export const IMAGE_FIELDS = ['heroImageUrl', 'mapImageUrl'] as const;
export type ImageField = (typeof IMAGE_FIELDS)[number];
