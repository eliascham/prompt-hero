"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ChallengeCard, type ChallengeCardStatus } from "@/components/ChallengeCard";
import { Badge } from "@/components/ui/badge";
import {
  type Tier,
  type ProgressMap,
  type ChallengeProgress,
  getAllTiers,
  getTierChallenges,
  getTierLabel,
  getTierUnlockText,
  getTierCompletionCount,
  getTierForDifficulty,
  isTierUnlocked,
} from "@/lib/progress";
import type { ScoreRank } from "@/lib/types";
import { Zap, Lock, Unlock, Trophy } from "lucide-react";
import Link from "next/link";

interface ChallengeSummary {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  estimatedMinutes: number;
}

interface CampaignViewProps {
  challenges: ChallengeSummary[];
}

export function CampaignView({ challenges }: CampaignViewProps) {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState<ProgressMap>(new Map());
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProgress(new Map());
      return;
    }

    setProgressLoading(true);
    fetch("/api/progress", {
      headers: { Authorization: `Bearer ${user.id}` },
    })
      .then((res) => res.json())
      .then((data: { completed: Record<string, ChallengeProgress> }) => {
        const map: ProgressMap = new Map();
        for (const [id, entry] of Object.entries(data.completed ?? {})) {
          map.set(id, entry);
        }
        setProgress(map);
      })
      .catch(() => {})
      .finally(() => setProgressLoading(false));
  }, [user]);

  // Build a lookup from challenge ID to challenge data
  const challengeMap = new Map(challenges.map((c) => [c.id, c]));

  function getCardStatus(challengeId: string, tier: Tier): ChallengeCardStatus {
    if (progress.has(challengeId)) return "completed";
    if (!user && tier !== "tutorial") return "locked";
    if (isTierUnlocked(tier, progress)) return "unlocked";
    return "locked";
  }

  const tiers = getAllTiers();
  const isLoading = authLoading || progressLoading;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Hero */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-400">
            Campaign Mode
          </span>
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Prompt Hero
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          The AI has a flawed brief. You have the truth. Guide the AI to the
          correct solution through conversation alone.
        </p>
      </div>

      {/* Sign-in prompt for anonymous users */}
      {!authLoading && !user && (
        <div className="mb-8 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-center text-sm text-amber-400/80">
          <Link href="/login" className="underline hover:text-amber-300">
            Sign in
          </Link>{" "}
          to track your progress and unlock higher tiers.
        </div>
      )}

      {/* Campaign Tiers */}
      <div className="space-y-10">
        {tiers.map((tier) => {
          const tierChallengeIds = getTierChallenges(tier);
          const tierChallenges = tierChallengeIds
            .map((id) => challengeMap.get(id))
            .filter(Boolean) as ChallengeSummary[];
          const unlocked = user ? isTierUnlocked(tier, progress) : tier === "tutorial";
          const { done, total } = getTierCompletionCount(tier, progress);

          return (
            <section key={tier}>
              {/* Tier header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {unlocked ? (
                    done === total && total > 0 ? (
                      <Trophy className="h-5 w-5 text-amber-400" />
                    ) : (
                      <Unlock className="h-5 w-5 text-emerald-400" />
                    )
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground/50" />
                  )}
                  <h2 className="text-lg font-semibold">
                    {getTierLabel(tier)}
                  </h2>
                </div>
                {user && !isLoading && (
                  <Badge
                    variant="outline"
                    className={
                      done === total && total > 0
                        ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                        : "border-border/50 text-muted-foreground"
                    }
                  >
                    {done}/{total}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {!unlocked && getTierUnlockText(tier)}
                </span>
              </div>

              {/* Challenge cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tierChallenges.map((c) => {
                  const status = getCardStatus(c.id, tier);
                  const prog = progress.get(c.id);
                  return (
                    <ChallengeCard
                      key={c.id}
                      {...c}
                      status={status}
                      bestRank={prog?.bestRank}
                      bestScore={prog?.bestScore}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
