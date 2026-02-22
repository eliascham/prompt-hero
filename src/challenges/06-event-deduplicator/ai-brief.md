# Event Deduplicator

## Overview
Build an event deduplicator that removes duplicate events from a stream.

## Requirements
1. Accept an array of event objects with: id, source, eventType, timestamp, payload
2. Deduplicate using the event `id` field — events with the same id are duplicates
3. Keep the first occurrence of each duplicate
4. Preserve original array order in output
5. Use the existing helper function in the starter code as a foundation
