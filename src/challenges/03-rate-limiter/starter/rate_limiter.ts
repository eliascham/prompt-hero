export interface RedisStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number }): Promise<void>;
  del(key: string): Promise<void>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number | null;
}

export interface RateLimiterConfig {
  windowMs?: number;       // default 60000
  maxRequests?: number;    // default 100
  store: RedisStore;
}

/**
 * Creates a rate limiter instance.
 */
export function createRateLimiter(config: RateLimiterConfig) {
  const windowMs = config.windowMs ?? 60000;
  const maxRequests = config.maxRequests ?? 100;
  const store = config.store;

  /**
   * Check and consume a rate limit token for a user+endpoint pair.
   * @param userId - The user identifier
   * @param endpoint - The API endpoint being accessed
   * @returns Rate limit result
   */
  async function checkLimit(
    userId: string,
    endpoint: string
  ): Promise<RateLimitResult> {
    // TODO: Implement sliding window rate limiting
    return { allowed: true, remaining: maxRequests, retryAfterMs: null };
  }

  return { checkLimit };
}
