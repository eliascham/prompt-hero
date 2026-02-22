export interface LogEntry {
  service: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: string; // ISO 8601, possibly with timezone offset
}

export interface AggregationResult {
  /** Map of "service:level" -> count */
  aggregation: Record<string, number>;
  /** Error rate per service as percentage */
  errorRates: Record<string, number>;
  /** Total valid log entries processed */
  totalCount: number;
  /** Number of malformed lines skipped */
  malformedCount: number;
}

/**
 * Aggregates newline-delimited JSON logs.
 * @param ndjsonInput - Newline-delimited JSON string
 * @returns Aggregation results
 */
export function aggregateLogs(ndjsonInput: string): AggregationResult {
  // TODO: Implement log aggregation
  return {
    aggregation: {},
    errorRates: {},
    totalCount: 0,
    malformedCount: 0,
  };
}
