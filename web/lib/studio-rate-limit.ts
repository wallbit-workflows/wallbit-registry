import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type StudioRateLimitResult =
  | { ok: true; limit: number; remaining: number; reset: number }
  | { ok: false; limit: number; retryAfterSec: number };

const DEFAULT_MAX = 20;
const DEFAULT_WINDOW = "1 h";

function studioLimitMax(): number {
  const n = Number(process.env.STUDIO_RATE_LIMIT_MAX);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MAX;
}

function studioLimitWindow(): string {
  return process.env.STUDIO_RATE_LIMIT_WINDOW?.trim() || DEFAULT_WINDOW;
}

function parseWindowMs(window: string): number {
  const match = window.match(/^(\d+)\s*(ms|s|m|h|d)$/i);
  if (!match) return 3_600_000;
  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  const mult: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return n * (mult[unit] ?? 3_600_000);
}

type MemEntry = { count: number; resetAt: number };

class MemoryStudioRateLimiter {
  private readonly buckets = new Map<string, MemEntry>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  check(userId: string): StudioRateLimitResult {
    const now = Date.now();
    const limit = this.max;
    let entry = this.buckets.get(userId);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + this.windowMs };
    }

    if (entry.count >= limit) {
      this.buckets.set(userId, entry);
      return {
        ok: false,
        limit,
        retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      };
    }

    entry.count += 1;
    this.buckets.set(userId, entry);

    return {
      ok: true,
      limit,
      remaining: Math.max(0, limit - entry.count),
      reset: entry.resetAt,
    };
  }
}

let upstashLimiter: Ratelimit | null | undefined;
let memoryLimiter: MemoryStudioRateLimiter | null = null;

function upstashStudioLimiter(): Ratelimit | null {
  if (upstashLimiter !== undefined) return upstashLimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    upstashLimiter = null;
    return null;
  }

  upstashLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(
      studioLimitMax(),
      studioLimitWindow() as `${number} s`,
    ),
    prefix: "wallbit-registry:studio",
  });
  return upstashLimiter;
}

function memoryStudioLimiter(): MemoryStudioRateLimiter {
  if (!memoryLimiter) {
    memoryLimiter = new MemoryStudioRateLimiter(
      studioLimitMax(),
      parseWindowMs(studioLimitWindow()),
    );
  }
  return memoryLimiter;
}

/** Per Clerk user id — limits Workflow Studio Cursor agent requests. */
export async function checkStudioRateLimit(
  clerkUserId: string,
): Promise<StudioRateLimitResult> {
  const redis = upstashStudioLimiter();
  if (redis) {
    const { success, limit, remaining, reset } = await redis.limit(clerkUserId);
    if (!success) {
      return {
        ok: false,
        limit,
        retryAfterSec: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
      };
    }
    return { ok: true, limit, remaining, reset };
  }

  return memoryStudioLimiter().check(clerkUserId);
}

export function studioRateLimitHeaders(
  result: StudioRateLimitResult,
): Record<string, string> {
  if (!result.ok) {
    return {
      "Retry-After": String(result.retryAfterSec),
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": "0",
    };
  }
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
  };
}
