# Log Aggregator

## Overview
Build a log aggregator that processes newline-delimited JSON logs, aggregates by service and level, calculates error rates, and handles timezone normalization.

## Requirements
1. Accept **newline-delimited JSON** (NDJSON) input — each line is one JSON log entry
2. Each log entry has: service, level (info/warn/error/debug), message, timestamp (ISO 8601 with timezone)
3. Aggregate logs by **service + level** combination
4. Calculate **error rate** per service: (error count / total count for that service) × 100, as a percentage
5. **Normalize all timestamps to UTC** before aggregation (inputs may have various timezone offsets)
6. Handle **malformed lines** gracefully — skip them and count them in a `malformedCount` field
7. Return: aggregation map, error rates per service, total log count, malformed count

## Edge Cases
- Empty input returns zero counts
- All lines malformed → only malformedCount populated
- Timestamps with +05:30, -08:00, Z offsets should all normalize to UTC
- Service names are case-sensitive

## Test Summary
5 tests covering: basic aggregation, error rate calculation, timezone normalization, malformed line handling, and empty input.
