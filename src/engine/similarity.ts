import type { TruthSpec } from "@/lib/types";

const SIMILARITY_THRESHOLD = 0.85;

/**
 * Tokenizes text into normalized word set.
 */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

/**
 * Computes Jaccard similarity between two token sets.
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Extracts all text content from a truth spec for comparison.
 */
function extractTruthText(truthSpec: TruthSpec): string {
  const parts: string[] = [
    truthSpec.title,
    truthSpec.overview,
    ...truthSpec.requirements.map((r) => r.text),
    ...truthSpec.edgeCases,
    truthSpec.testSummary,
  ];
  return parts.join(" ");
}

/**
 * Checks semantic similarity between a user message and the truth spec.
 * Uses Jaccard word-overlap as a placeholder (can be replaced with embeddings).
 * Threshold: 0.85 = blocked.
 */
export function checkSimilarity(
  message: string,
  truthSpec: TruthSpec
): { blocked: boolean; score: number } {
  const messageTokens = tokenize(message);
  const truthText = extractTruthText(truthSpec);
  const truthTokens = tokenize(truthText);

  const score = jaccardSimilarity(messageTokens, truthTokens);

  return {
    blocked: score >= SIMILARITY_THRESHOLD,
    score,
  };
}
