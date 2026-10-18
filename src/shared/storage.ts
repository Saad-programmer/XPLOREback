/** Small synchronous key-value store: localStorage in the browser, a Map in tests. */
export interface KeyValueStore {
  get(key: string): string | null;
  /** Returns false when the value could not be saved (storage full or blocked). */
  set(key: string, value: string): boolean;
  remove(key: string): void;
}

export function memoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    get: (key) => map.get(key) ?? null,
    set: (key, value) => {
      map.set(key, value);
      return true;
    },
    remove: (key) => {
      map.delete(key);
    },
  };
}

/** localStorage, falling back to memory when it is blocked (private mode, SSR). */
export function browserStore(): KeyValueStore {
  let storage: Storage | null = null;
  try {
    storage = window.localStorage;
    storage.getItem('labs:probe');
  } catch {
    return memoryStore();
  }
  const local = storage;
  return {
    get: (key) => {
      try {
        return local.getItem(key);
      } catch {
        return null;
      }
    },
    set: (key, value) => {
      try {
        local.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    remove: (key) => {
      try {
        local.removeItem(key);
      } catch {
        // Nothing to do: the value stays, which is harmless.
      }
    },
  };
}

export function readJson<T>(store: KeyValueStore, key: string): T | null {
  const raw = store.get(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(store: KeyValueStore, key: string, value: unknown): boolean {
  return store.set(key, JSON.stringify(value));
}
