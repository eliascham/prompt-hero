"use client";

import Link from "next/link";
import type { ScoreResponse, ScoreRank } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Home, RotateCcw } from "lucide-react";

interface ScoreDisplayProps {
  score: ScoreResponse;
  challengeId?: string;
}

const rankColors: Record<ScoreRank, string> = {
  S: "text-amber-400",
  A: "text-emerald-400",
  B: "text-sky-400",
  C: "text-violet-400",
  D: "text-orange-400",
  F: "text-red-400",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreDisplay({ score, challengeId }: ScoreDisplayProps) {
  return (
    <Card className="w-full max-w-md border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            Challenge Complete
          </span>
          <span className={`text-3xl font-bold ${rankColors[score.rank]}`}>
            {score.rank}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScoreBar label="Correctness (50%)" value={score.correctness} />
        <ScoreBar
          label="Intervention Efficiency (30%)"
          value={score.interventionEfficiency}
        />
        <ScoreBar
          label="Diagnosis Quality (20%)"
          value={score.diagnosisQuality}
        />
        <div className="mt-4 border-t border-border/40 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Score</span>
            <span className="text-lg font-bold font-mono">
              {Math.round(score.totalScore)}%
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full gap-2" size="sm">
              <Home className="h-3.5 w-3.5" />
              Campaign
            </Button>
          </Link>
          {challengeId && (
            <Link href={`/challenge/${challengeId}`} className="flex-1">
              <Button variant="secondary" className="w-full gap-2" size="sm">
                <RotateCcw className="h-3.5 w-3.5" />
                Try Again
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
