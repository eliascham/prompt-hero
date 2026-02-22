import { deduplicateEvents, Event } from "../starter/event_deduplicator";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.log(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

// Test 1: Basic deduplication (same composite key within 5s window)
const basicEvents: Event[] = [
  { id: "a1", source: "api", eventType: "click", timestamp: "2024-01-01T00:00:00Z", payload: { page: "home" } },
  { id: "a2", source: "api", eventType: "click", timestamp: "2024-01-01T00:00:03Z", payload: { page: "home" } },
];
const basicResult = deduplicateEvents(basicEvents);
assert(
  basicResult.length === 1,
  "basic dedup - same source+type within 5s window deduped - dedup logic incorrect"
);
assert(basicResult[0].id === "a1", "basic dedup - keeps first occurrence");

// Test 2: ID is a red herring — same id but different composite key should NOT dedup
const redHerring: Event[] = [
  { id: "same-id", source: "api", eventType: "click", timestamp: "2024-01-01T00:00:00Z", payload: {} },
  { id: "same-id", source: "webhook", eventType: "submit", timestamp: "2024-01-01T00:00:00Z", payload: {} },
];
const redResult = deduplicateEvents(redHerring);
assert(
  redResult.length === 2,
  "id red herring - same id but different source/type are NOT duplicates - using id-based dedup instead of composite key"
);

// Test 3: Different ids but same composite key ARE duplicates
const compositeKey: Event[] = [
  { id: "x1", source: "sensor", eventType: "temperature", timestamp: "2024-01-01T12:00:00Z", payload: { value: 72 } },
  { id: "x2", source: "sensor", eventType: "temperature", timestamp: "2024-01-01T12:00:04Z", payload: { value: 73 } },
];
const compositeResult = deduplicateEvents(compositeKey);
assert(
  compositeResult.length === 1,
  "composite key - different ids but same composite key within window are duplicates - key construction incorrect"
);

// Test 4: Timestamp window boundary (>5s apart = not duplicates)
const windowBoundary: Event[] = [
  { id: "b1", source: "api", eventType: "click", timestamp: "2024-01-01T00:00:00Z", payload: {} },
  { id: "b2", source: "api", eventType: "click", timestamp: "2024-01-01T00:00:06Z", payload: {} },
];
const windowResult = deduplicateEvents(windowBoundary);
assert(
  windowResult.length === 2,
  "window boundary - events >5s apart are not duplicates - timestamp window incorrect"
);

// Test 5: Order preservation
const orderEvents: Event[] = [
  { id: "c1", source: "api", eventType: "click", timestamp: "2024-01-01T00:00:00Z", payload: { n: 1 } },
  { id: "c2", source: "api", eventType: "submit", timestamp: "2024-01-01T00:00:00Z", payload: { n: 2 } },
  { id: "c3", source: "api", eventType: "click", timestamp: "2024-01-01T00:00:02Z", payload: { n: 3 } }, // dup of c1
  { id: "c4", source: "webhook", eventType: "ping", timestamp: "2024-01-01T00:00:00Z", payload: { n: 4 } },
];
const orderResult = deduplicateEvents(orderEvents);
assert(orderResult.length === 3, "order preservation - correct count after dedup");
assert(
  orderResult[0].id === "c1" && orderResult[1].id === "c2" && orderResult[2].id === "c4",
  "order preservation - original order maintained"
);

// Test 6: Empty input
const emptyResult = deduplicateEvents([]);
assert(emptyResult.length === 0, "empty input - returns empty array");

console.log("All tests passed!");
