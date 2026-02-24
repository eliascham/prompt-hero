import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

function getRedis() {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    return (getRedis() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Session cache helpers
const SESSION_PREFIX = "session:";
const SESSION_TTL = 60 * 60 * 2; // 2 hours

export async function cacheSession(sessionId: string, data: unknown) {
  await redis.set(`${SESSION_PREFIX}${sessionId}`, JSON.stringify(data), {
    ex: SESSION_TTL,
  });
}

export async function getCachedSession(sessionId: string) {
  const raw = await redis.get(`${SESSION_PREFIX}${sessionId}`);
  if (!raw) return null;
  // Upstash auto-deserializes JSON; handle both string and object
  if (typeof raw === "string") {
    return JSON.parse(raw);
  }
  return raw;
}

export async function invalidateSession(sessionId: string) {
  await redis.del(`${SESSION_PREFIX}${sessionId}`);
}
