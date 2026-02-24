import type { ScoreRank } from "@/lib/types";

export type Tier = "tutorial" | "standard" | "advanced";

export interface ChallengeProgress {
  bestScore: number;
  bestRank: ScoreRank;
  completedAt: string;
}

export type ProgressMap = Map<string, ChallengeProgress>;

const TIER_CHALLENGES: Record<Tier, string[]> = {
  tutorial: ["01-invoice-parser", "02-leaderboard-ranking"],
  standard: ["03-rate-limiter", "04-config-migration", "05-pii-redaction"],
  advanced: [
    "06-event-deduplicator",
    "07-notification-router",
    "08-log-aggregator",
  ],
};

const TIER_LABELS: Record<Tier, string> = {
  tutorial: "Tutorial",
  standard: "Standard",
  advanced: "Advanced",
};

const TIER_ORDER: Tier[] = ["tutorial", "standard", "advanced"];

export function getTierForDifficulty(
  difficulty: "easy" | "medium" | "hard",
): Tier {
  switch (difficulty) {
    case "easy":
      return "tutorial";
    case "medium":
      return "standard";
    case "hard":
      return "advanced";
  }
}

export function getTierChallenges(tier: Tier): string[] {
  return TIER_CHALLENGES[tier];
}

export function getTierLabel(tier: Tier): string {
  return TIER_LABELS[tier];
}

export function getAllTiers(): Tier[] {
  return TIER_ORDER;
}

function countCompletedInTier(tier: Tier, completed: ProgressMap): number {
  return TIER_CHALLENGES[tier].filter((id) => completed.has(id)).length;
}

export function isTierUnlocked(tier: Tier, completed: ProgressMap): boolean {
  switch (tier) {
    case "tutorial":
      return true;
    case "standard":
      return countCompletedInTier("tutorial", completed) >= 1;
    case "advanced":
      return countCompletedInTier("standard", completed) >= 2;
  }
}

export function getTierUnlockText(tier: Tier): string {
  switch (tier) {
    case "tutorial":
      return "Always available";
    case "standard":
      return "Complete 1 Tutorial challenge to unlock";
    case "advanced":
      return "Complete 2 Standard challenges to unlock";
  }
}

export function getTierCompletionCount(
  tier: Tier,
  completed: ProgressMap,
): { done: number; total: number } {
  const ids = TIER_CHALLENGES[tier];
  return {
    done: ids.filter((id) => completed.has(id)).length,
    total: ids.length,
  };
}
