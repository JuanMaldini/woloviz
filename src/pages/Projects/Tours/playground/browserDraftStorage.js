const DRAFT_STORAGE_KEY = "playground:editor-draft:v1";
const SESSION_ID_STORAGE_KEY = "playground:editor-session-id:v1";

const DB_NAME = "playground-editor-db";
const DB_VERSION = 1;
const BLOB_STORE_NAME = "imageBlobs";

function canUseBrowserStorage() {
  return typeof window !== "undefined";
}

export function getOrCreatePlaygroundSessionId() {
  if (!canUseBrowserStorage()) {
    return "";
  }

  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const next = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_ID_STORAGE_KEY, next);
    return next;
  } catch {
    return "";
  }
}

function openImageDb() {
  if (!canUseBrowserStorage() || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(BLOB_STORE_NAME)) {
          db.createObjectStore(BLOB_STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

function runBlobStoreRequest(mode, handler) {
  return openImageDb().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }

        try {
          const transaction = db.transaction(BLOB_STORE_NAME, mode);
          const store = transaction.objectStore(BLOB_STORE_NAME);
          const request = handler(store);

          request.onsuccess = () => resolve(request.result ?? true);
          request.onerror = () => resolve(null);
          transaction.onabort = () => resolve(null);
        } catch {
          resolve(null);
        }
      }),
  );
}

export async function savePlaygroundImageBlob({
  sessionId,
  kind,
  sceneIndex,
  file,
}) {
  if (!file || !canUseBrowserStorage()) {
    return "";
  }

  const safeSessionId = String(sessionId || "").trim();
  if (!safeSessionId) {
    return "";
  }

  const blobId = [
    safeSessionId,
    String(kind || "asset"),
    Number.isInteger(sceneIndex) ? sceneIndex : "root",
    Date.now(),
    Math.random().toString(36).slice(2, 8),
  ].join(":");

  const result = await runBlobStoreRequest("readwrite", (store) =>
    store.put(file, blobId),
  );

  return result ? blobId : "";
}

export async function loadPlaygroundImageBlob(blobId) {
  const safeBlobId = String(blobId || "").trim();
  if (!safeBlobId) {
    return null;
  }

  const result = await runBlobStoreRequest("readonly", (store) =>
    store.get(safeBlobId),
  );

  if (result instanceof Blob || result instanceof File) {
    return result;
  }
  return null;
}

export function writePlaygroundDraftToSession(draft) {
  if (!canUseBrowserStorage()) {
    return false;
  }

  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function readPlaygroundDraftFromSession() {
  if (!canUseBrowserStorage()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
