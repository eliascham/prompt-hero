import type { TestResult, Challenge, ScoreRank } from "./types";

/**
 * Correctness = (tests passed / total tests) × 100
 */
export function calculateCorrectness(testResults: TestResult[]): number {
  if (testResults.length === 0) return 0;
  const passed = testResults.filter((t) => t.passed).length;
  return (passed / testResults.length) * 100;
}

/**
 * Efficiency = max(0, 100 - (reveals × 15) - (messages × 2))
 */
export function calculateEfficiency(
  revealsUsed: number,
  messageCount: number,
): number {
  return Math.max(0, 100 - revealsUsed * 15 - messageCount * 2);
}

/**
 * Diagnosis quality = keyword matching against known flaws.
 * Score = (identified flaws / total flaws) × 100
 */
export function calculateDiagnosisQuality(
  postMortem: string,
  challenge: Challenge,
): number {
  const flaws = challenge.aiBrief.flaws;
  if (flaws.length === 0) return 100;

  const lowerPostMortem = postMortem.toLowerCase();
  let identified = 0;

  for (const flaw of flaws) {
    const keywords = extractKeywords(flaw.description);
    const matchesEnough = keywords.some((kw) => lowerPostMortem.includes(kw));
    if (matchesEnough) identified++;
  }

  return (identified / flaws.length) * 100;
}

/**
 * Extract meaningful keywords from a flaw description for matching.
 */
function extractKeywords(description: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can",
    "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "and",
    "but", "or", "not", "no", "if", "then", "than", "that",
    "this", "it", "its", "which", "who", "whom", "what", "where",
    "when", "how", "all", "each", "every", "both", "few", "more",
    "most", "other", "some", "such", "only", "very", "just",
  ]);

  const words = description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  // Return individual meaningful words and 2-word phrases
  const phrases: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }

  return [...phrases, ...words];
}

/**
 * Total = correctness × 0.5 + efficiency × 0.3 + diagnosis × 0.2
 */
export function calculateTotalScore(
  correctness: number,
  efficiency: number,
  diagnosis: number,
): number {
  return correctness * 0.5 + efficiency * 0.3 + diagnosis * 0.2;
}

/**
 * Determine rank based on total score and conditions.
 * S: ≥95 AND 100% correctness AND 0 reveals AND efficiency > 80
 * A: ≥85, B: ≥70, C: ≥55, D: ≥40, F: <40
 */
export function determineRank(
  totalScore: number,
  correctness: number,
  revealsUsed: number,
  efficiency: number,
): ScoreRank {
  if (
    totalScore >= 95 &&
    correctness === 100 &&
    revealsUsed === 0 &&
    efficiency > 80
  ) {
    return "S";
  }
  if (totalScore >= 85) return "A";
  if (totalScore >= 70) return "B";
  if (totalScore >= 55) return "C";
  if (totalScore >= 40) return "D";
  return "F";
}
