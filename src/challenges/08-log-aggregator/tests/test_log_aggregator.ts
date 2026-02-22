import { aggregateLogs } from "../starter/log_aggregator";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.log(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

function approxEqual(a: number, b: number, epsilon = 0.1): boolean {
  return Math.abs(a - b) < epsilon;
}

// Test 1: Basic aggregation
const basicLogs = [
  '{"service":"auth","level":"info","message":"Login","timestamp":"2024-01-15T10:00:00Z"}',
  '{"service":"auth","level":"error","message":"Failed","timestamp":"2024-01-15T10:01:00Z"}',
  '{"service":"api","level":"info","message":"Request","timestamp":"2024-01-15T10:02:00Z"}',
].join("\n");

const basicResult = aggregateLogs(basicLogs);
assert(basicResult.totalCount === 3, "basic aggregation - total count is 3");
assert(
  basicResult.aggregation["auth:info"] === 1,
  "basic aggregation - auth:info count is 1"
);
assert(
  basicResult.aggregation["auth:error"] === 1,
  "basic aggregation - auth:error count is 1"
);
assert(
  basicResult.aggregation["api:info"] === 1,
  "basic aggregation - api:info count is 1"
);

// Test 2: Error rate calculation (percentage)
const errorRateLogs = [
  '{"service":"auth","level":"info","message":"OK","timestamp":"2024-01-15T10:00:00Z"}',
  '{"service":"auth","level":"info","message":"OK","timestamp":"2024-01-15T10:01:00Z"}',
  '{"service":"auth","level":"error","message":"Bad","timestamp":"2024-01-15T10:02:00Z"}',
  '{"service":"auth","level":"error","message":"Bad","timestamp":"2024-01-15T10:03:00Z"}',
  '{"service":"api","level":"info","message":"OK","timestamp":"2024-01-15T10:04:00Z"}',
].join("\n");

const errorResult = aggregateLogs(errorRateLogs);
// auth: 2 errors out of 4 total = 50%
assert(
  approxEqual(errorResult.errorRates["auth"], 50),
  "error rate - auth error rate is 50% - error rate calculation incorrect"
);
// api: 0 errors out of 1 total = 0%
assert(
  approxEqual(errorResult.errorRates["api"], 0),
  "error rate - api error rate is 0%"
);

// Test 3: Timezone normalization (input is NDJSON, not JSON array)
const tzLogs = [
  '{"service":"auth","level":"info","message":"A","timestamp":"2024-01-15T15:30:00+05:30"}',
  '{"service":"auth","level":"info","message":"B","timestamp":"2024-01-15T10:00:00Z"}',
  '{"service":"auth","level":"info","message":"C","timestamp":"2024-01-15T02:00:00-08:00"}',
].join("\n");

const tzResult = aggregateLogs(tzLogs);
assert(
  tzResult.totalCount === 3,
  "timezone normalization - all 3 entries parsed from NDJSON format - input format incorrect"
);
assert(
  tzResult.aggregation["auth:info"] === 3,
  "timezone normalization - all auth:info entries aggregated"
);

// Test 4: Malformed line handling
const malformedLogs = [
  '{"service":"auth","level":"info","message":"OK","timestamp":"2024-01-15T10:00:00Z"}',
  "this is not json",
  '{"service":"api","level":"warn","message":"Slow","timestamp":"2024-01-15T10:01:00Z"}',
  "{bad json",
  '{"service":"api","level":"error","message":"Fail","timestamp":"2024-01-15T10:02:00Z"}',
].join("\n");

const malformedResult = aggregateLogs(malformedLogs);
assert(
  malformedResult.totalCount === 3,
  "malformed handling - 3 valid entries counted"
);
assert(
  malformedResult.malformedCount === 2,
  "malformed handling - 2 malformed lines counted - malformed line handling missing"
);

// Test 5: Empty input
const emptyResult = aggregateLogs("");
assert(emptyResult.totalCount === 0, "empty input - total count is 0");
assert(emptyResult.malformedCount === 0, "empty input - malformed count is 0");
assert(
  Object.keys(emptyResult.aggregation).length === 0,
  "empty input - aggregation is empty"
);

console.log("All tests passed!");
