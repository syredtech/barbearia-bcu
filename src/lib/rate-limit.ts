import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// x-real-ip is set by Vercel's edge and cannot be spoofed by the client
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ??
    "unknown"
  );
}

// ── In-memory fallback (local dev — not shared across serverless instances) ──
const store = new Map<string, { count: number; reset: number }>();

function inMemoryLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
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

// ── Upstash distributed limiter (production) ─────────────────────────────────
let redis: Redis | null = null;
const limiters = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  const cacheKey = `${limit}:${windowMs}`;
  if (!limiters.has(cacheKey)) {
    limiters.set(cacheKey, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: false,
    }));
  }
  return limiters.get(cacheKey)!;
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const limiter = getUpstashLimiter(limit, windowMs);
  if (limiter) {
    const { success } = await limiter.limit(key);
    return success;
  }
  return inMemoryLimit(key, limit, windowMs);
}
