"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Clock, ArrowRight, Lock, Check } from "lucide-react";
import type { ScoreRank } from "@/lib/types";

export type ChallengeCardStatus = "locked" | "unlocked" | "completed";

interface ChallengeCardProps {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  estimatedMinutes: number;
  status?: ChallengeCardStatus;
  bestRank?: ScoreRank;
  bestScore?: number;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  hard: "bg-red-500/15 text-red-400 border-red-500/30",
};

const RANK_COLORS: Record<ScoreRank, string> = {
  S: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  A: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  B: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  C: "bg-green-500/20 text-green-400 border-green-500/50",
  D: "bg-gray-500/20 text-gray-400 border-gray-500/50",
  F: "bg-red-500/20 text-red-400 border-red-500/50",
};

export function ChallengeCard({
  id,
  title,
  difficulty,
  tags,
  estimatedMinutes,
  status = "unlocked",
  bestRank,
  bestScore,
}: ChallengeCardProps) {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";

  const card = (
    <Card
      className={`group border-border/50 transition-all ${
        isLocked
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:border-border hover:bg-card"
      } ${isCompleted ? "border-emerald-500/30 bg-emerald-500/5" : "bg-card/50"}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={difficultyColors[difficulty]}>
            {difficulty}
          </Badge>
          {isLocked && <Lock className="h-4 w-4 text-muted-foreground/50" />}
          {isCompleted && bestRank && (
            <Badge variant="outline" className={RANK_COLORS[bestRank]}>
              {bestRank}
            </Badge>
          )}
          {!isLocked && !isCompleted && (
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </div>
        <CardTitle className="text-base leading-snug">
          {isCompleted && (
            <Check className="mr-1.5 inline h-4 w-4 text-emerald-400" />
          )}
          {title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />~{estimatedMinutes} min
          </span>
          {isCompleted && bestScore !== undefined && (
            <span className="font-mono text-emerald-400">
              {bestScore.toFixed(1)}pts
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] font-normal"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (isLocked) {
    return <div>{card}</div>;
  }

  return <Link href={`/challenge/${id}`}>{card}</Link>;
}
