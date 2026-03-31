type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export function createTtlCache<T>() {
  const store = new Map<string, CacheEntry<T>>();

  return {
    get(key: string) {
      const entry = store.get(key);
      if (!entry) {
        return undefined;
      }

      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
      }

      return entry.value;
    },
    set(key: string, value: T, ttlMs: number) {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
    },
    delete(key: string) {
      store.delete(key);
    },
  };
}
