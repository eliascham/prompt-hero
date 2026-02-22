import { createRateLimiter, RedisStore } from "../starter/rate_limiter";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.log(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

// In-memory mock Redis store
function createMockStore(): RedisStore {
  const data = new Map<string, { value: string; expiresAt?: number }>();
  return {
    async get(key: string) {
      const entry = data.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        data.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key: string, value: string, options?: { ex?: number }) {
      const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : undefined;
      data.set(key, { value, expiresAt });
    },
    async del(key: string) {
      data.delete(key);
    },
  };
}

async function runTests() {
  // Test 1: First request is always allowed
  const store1 = createMockStore();
  const limiter1 = createRateLimiter({ store: store1, maxRequests: 5, windowMs: 60000 });
  const result1 = await limiter1.checkLimit("user1", "/api/data");
  assert(result1.allowed === true, "first request - always allowed");
  assert(result1.remaining === 4, "first request - remaining decremented");

  // Test 2: Deny after limit exceeded
  const store2 = createMockStore();
  const limiter2 = createRateLimiter({ store: store2, maxRequests: 3, windowMs: 60000 });
  await limiter2.checkLimit("user1", "/api/data");
  await limiter2.checkLimit("user1", "/api/data");
  await limiter2.checkLimit("user1", "/api/data");
  const denied = await limiter2.checkLimit("user1", "/api/data");
  assert(denied.allowed === false, "rate limit exceeded - request denied after limit reached");
  assert(denied.remaining === 0, "rate limit exceeded - remaining is 0");
  assert(
    typeof denied.retryAfterMs === "number" && denied.retryAfterMs > 0,
    "rate limit exceeded - retryAfterMs provided - missing retry timing"
  );

  // Test 3: Per-user AND per-endpoint independence
  const store3 = createMockStore();
  const limiter3 = createRateLimiter({ store: store3, maxRequests: 2, windowMs: 60000 });
  await limiter3.checkLimit("user1", "/api/data");
  await limiter3.checkLimit("user1", "/api/data");
  // user1 /api/data is exhausted
  const diffEndpoint = await limiter3.checkLimit("user1", "/api/other");
  assert(
    diffEndpoint.allowed === true,
    "per-endpoint independence - different endpoint has separate limit - endpoint tracking incorrect"
  );
  const diffUser = await limiter3.checkLimit("user2", "/api/data");
  assert(
    diffUser.allowed === true,
    "per-user independence - different user has separate limit"
  );

  // Test 4: Remaining count accuracy
  const store4 = createMockStore();
  const limiter4 = createRateLimiter({ store: store4, maxRequests: 5, windowMs: 60000 });
  const r1 = await limiter4.checkLimit("user1", "/api/data");
  const r2 = await limiter4.checkLimit("user1", "/api/data");
  const r3 = await limiter4.checkLimit("user1", "/api/data");
  assert(r1.remaining === 4, "remaining count - 4 after first request");
  assert(r2.remaining === 3, "remaining count - 3 after second request");
  assert(r3.remaining === 2, "remaining count - 2 after third request - count tracking incorrect");

  // Test 5: Sliding window (requests expire after window)
  const store5 = createMockStore();
  const limiter5 = createRateLimiter({ store: store5, maxRequests: 2, windowMs: 100 });
  await limiter5.checkLimit("user1", "/api/data");
  await limiter5.checkLimit("user1", "/api/data");
  // Wait for window to expire
  await new Promise((resolve) => setTimeout(resolve, 150));
  const afterWindow = await limiter5.checkLimit("user1", "/api/data");
  assert(
    afterWindow.allowed === true,
    "sliding window - requests allowed after window expires - window type incorrect"
  );
  assert(
    afterWindow.remaining === 1,
    "sliding window - remaining resets after window"
  );

  console.log("All tests passed!");
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
