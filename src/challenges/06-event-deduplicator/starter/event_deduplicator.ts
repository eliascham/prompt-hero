export interface Event {
  id: string;
  source: string;
  eventType: string;
  timestamp: string; // ISO 8601
  payload: Record<string, unknown>;
}

/**
 * TRAP: This helper uses id-based deduplication which is incorrect.
 * The AI brief points to using this, but the truth requires composite key dedup.
 */
function deduplicateById(events: Event[]): Event[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

/**
 * Deduplicates events from the input array.
 * @param events - Array of event objects
 * @returns Deduplicated array preserving original order
 */
export function deduplicateEvents(events: Event[]): Event[] {
  // Starter implementation uses id-based dedup (this is the trap!)
  return deduplicateById(events);
}
