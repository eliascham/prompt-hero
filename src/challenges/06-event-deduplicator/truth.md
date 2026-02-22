# Event Deduplicator

## Overview
Build an event deduplicator that identifies duplicate events using a composite key and preserves original ordering.

## Requirements
1. Accept an array of event objects with: id, source, eventType, timestamp, payload
2. Deduplicate using **composite key**: source + eventType + timestamp within 5-second window
3. Events with the same source, eventType, and timestamps within 5 seconds of each other are duplicates
4. Keep the **first** occurrence, discard later duplicates
5. Preserve **original array order** in output
6. The `id` field is NOT used for deduplication (it's a red herring)

## Edge Cases
- Events with same id but different source/type/time are NOT duplicates
- Events with different ids but same composite key ARE duplicates
- Timestamps are ISO 8601 strings
- Empty array returns empty array
- Events exactly 5 seconds apart are duplicates; more than 5 seconds apart are not

## Test Summary
6 tests covering: basic dedup, composite key (not id-based), timestamp window, order preservation, id-as-red-herring, and empty input.
