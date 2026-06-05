// Sliding window in-memory rate limiter (per serverless instance).
// For distributed rate limiting across instances, replace with @upstash/ratelimit.
const store = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  // Sweep expired entries to prevent unbounded memory growth
  if (store.size > 10_000) {
    store.forEach((v, k) => { if (now > v.reset) store.delete(k); });
  }
  const entry = store.get(key);
  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
