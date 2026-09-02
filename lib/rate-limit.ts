// In-memory per-key rate limiter (sliding fixed window).
// Lives on the module singleton of the long-running `next start` process —
// fine for a single-instance deployment. Prunes itself when it grows.
// NOT for multi-instance setups (behind that, use Redis or similar).

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
}

export function checkRateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {}
): RateLimitResult {
  const limit = opts.limit ?? 10;
  const windowMs = opts.windowMs ?? 15 * 60 * 1000;
  const now = Date.now();

  let bucket = store.get(key);
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }
  bucket.count += 1;

  // occasional prune so the map can't grow forever
  if (store.size > 5000) {
    for (const [k, v] of store) {
      if (v.resetAt < now) store.delete(k);
    }
  }

  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfterSec: 0 };
}
