/**
 * Minimal IndexedDB wrapper.
 *
 * Field agents work in low/no-coverage areas, so queued submissions and their
 * captured media have to survive a tab close. localStorage can't hold video
 * blobs, hence IndexedDB. Deliberately dependency-free and promise-based.
 */

const DB_NAME = "sentinel-connect";
const DB_VERSION = 1;

export const STORES = {
  outbox: "outbox",
  media: "media",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.outbox)) {
        db.createObjectStore(STORES.outbox, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.media)) {
        db.createObjectStore(STORES.media, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  // A failed open must not poison every later call.
  dbPromise.catch(() => {
    dbPromise = null;
  });

  return dbPromise;
}

function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  work: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const request = work(tx.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export function idbGet<T>(store: StoreName, id: string): Promise<T | undefined> {
  return run<T | undefined>(store, "readonly", (s) => s.get(id) as IDBRequest<T | undefined>);
}

export function idbGetAll<T>(store: StoreName): Promise<T[]> {
  return run<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>);
}

export function idbPut<T>(store: StoreName, value: T): Promise<IDBValidKey> {
  return run<IDBValidKey>(store, "readwrite", (s) => s.put(value));
}

export function idbDelete(store: StoreName, id: string): Promise<undefined> {
  return run<undefined>(store, "readwrite", (s) => s.delete(id) as IDBRequest<undefined>);
}

export function idbClear(store: StoreName): Promise<undefined> {
  return run<undefined>(store, "readwrite", (s) => s.clear() as IDBRequest<undefined>);
}

/** True when IndexedDB is usable (absent in some private-browsing modes). */
export function idbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}
