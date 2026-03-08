type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

function hasRedisConfig() {
  return Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);
}

function checkRateLimitMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    const nextEntry: Entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    store.set(key, nextEntry);
    return { allowed: true, remaining: limit - 1, resetAt: nextEntry.resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  store.set(key, existing);
  return { allowed: true, remaining: Math.max(limit - existing.count, 0), resetAt: existing.resetAt };
}

async function runUpstashCommand(path: string) {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Upstash Redis env vars are not set.");
  }

  const response = await fetch(`${UPSTASH_REDIS_REST_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as { result?: unknown };
  if (!response.ok) {
    throw new Error(`Upstash command failed (${response.status}).`);
  }
  return payload.result;
}

async function checkRateLimitRedis(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const windowSeconds = Math.max(Math.ceil(windowMs / 1000), 1);
  const namespacedKey = `ratelimit:${key}`;
  const now = Date.now();
  const resetAt = now + windowMs;

  const incrementResult = await runUpstashCommand(`/incr/${encodeURIComponent(namespacedKey)}`);
  const count = typeof incrementResult === "number" ? incrementResult : Number(incrementResult);

  if (Number.isNaN(count)) {
    throw new Error("Unexpected Upstash INCR result.");
  }

  if (count === 1) {
    await runUpstashCommand(`/expire/${encodeURIComponent(namespacedKey)}/${windowSeconds}`);
  }

  if (count > limit) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return {
    allowed: true,
    remaining: Math.max(limit - count, 0),
    resetAt,
  };
}

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (!hasRedisConfig()) {
    return checkRateLimitMemory(key, limit, windowMs);
  }

  try {
    return await checkRateLimitRedis(key, limit, windowMs);
  } catch {
    // Fail open to in-memory limiter if Redis is unavailable.
    return checkRateLimitMemory(key, limit, windowMs);
  }
}
