# Rate Limiter

## Overview
Implement a rate limiter that tracks request counts and limits users when they exceed their quota.

## Requirements
1. Implement fixed window rate limiting (reset counter at window boundary)
2. Track limits per user using a `Map<string, number>` for storage
3. Window size: 60 seconds
4. Default limit: 100 requests per window per user
5. Return an object with: allowed (boolean), remaining (number)
