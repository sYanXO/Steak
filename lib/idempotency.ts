type Entry<T> = {
  promise: Promise<T>;
  createdAt: number;
};

const entries = new Map<string, Entry<unknown>>();
const TTL_MS = 10 * 60 * 1000;

function cleanupExpiredEntries(now = Date.now()) {
  for (const [key, entry] of entries.entries()) {
    if (now - entry.createdAt > TTL_MS) {
      entries.delete(key);
    }
  }
}

export async function runIdempotent<T>(key: string, run: () => Promise<T>) {
  cleanupExpiredEntries();

  const existing = entries.get(key) as Entry<T> | undefined;

  if (existing) {
    return existing.promise;
  }

  const promise = run().catch((error) => {
    entries.delete(key);
    throw error;
  });

  entries.set(key, {
    promise,
    createdAt: Date.now()
  });

  return promise;
}

export function resetIdempotencyCache() {
  entries.clear();
}
