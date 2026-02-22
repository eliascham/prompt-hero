import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
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
  const raw = await redis.get<string>(`${SESSION_PREFIX}${sessionId}`);
  return raw ? JSON.parse(raw) : null;
}

export async function invalidateSession(sessionId: string) {
  await redis.del(`${SESSION_PREFIX}${sessionId}`);
}
