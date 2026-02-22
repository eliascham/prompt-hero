# Rate Limiter

## Overview
Implement a rate limiter that uses a sliding window algorithm with per-user AND per-endpoint tracking, backed by a Redis-compatible store interface.

## Requirements
1. Implement sliding window rate limiting (not fixed window)
2. Track limits **per-user AND per-endpoint** (composite key: userId + endpoint)
3. Window size: 60 seconds
4. Default limit: 100 requests per window per user-endpoint pair
5. Return an object with: allowed (boolean), remaining (number), retryAfterMs (number | null)
6. Accept a `RedisStore` interface for storage (get, set, del, expire methods)

## Edge Cases
- First request from a user-endpoint pair is always allowed
- Requests at exact window boundary should start a new window
- Different endpoints for the same user should have independent limits
- Handle concurrent requests gracefully (check-and-set)

## Test Summary
5 tests covering: basic allow/deny, sliding window behavior, per-user-endpoint independence, remaining count accuracy, and retry-after timing.
