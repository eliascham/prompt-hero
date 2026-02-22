"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ScoreRank, ScoreResponse } from "@/lib/types";

const RANK_COLORS: Record<ScoreRank, string> = {
  S: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  A: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  B: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  C: "bg-green-500/20 text-green-400 border-green-500/50",
  D: "bg-gray-500/20 text-gray-400 border-gray-500/50",
  F: "bg-red-500/20 text-red-400 border-red-500/50",
};

export default function PostMortemPage() {
  const params = useParams<{ sessionId: string }>();
  const [postMortem, setPostMortem] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (postMortem.length < 10) {
      setError("Please write at least 10 characters.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: params.sessionId,
          postMortem,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to submit");
      }

      const data: ScoreResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl space-y-6">
        {!result ? (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">Post-Mortem Analysis</CardTitle>
              <CardDescription>
                What did you discover about the AI&apos;s flawed brief? Describe
                the discrepancies you identified between the AI&apos;s behavior
                and the true requirements.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Textarea
                  placeholder="Describe the flaws you identified in the AI's understanding..."
                  value={postMortem}
                  onChange={(e) => setPostMortem(e.target.value)}
                  rows={8}
                  maxLength={1000}
                  className="resize-none"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {postMortem.length}/1000 characters (aim for 200-1000)
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || postMortem.length < 10}
                >
                  {submitting ? "Scoring..." : "Submit Analysis"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card className="border-border/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Score Breakdown</CardTitle>
              <div className="mt-4">
                <Badge
                  variant="outline"
                  className={`text-4xl px-6 py-2 ${RANK_COLORS[result.rank]}`}
                >
                  {result.rank}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ScoreBar
                  label="Total Score"
                  value={result.totalScore}
                  bold
                />
                <div className="border-t border-border/50 pt-4 space-y-3">
                  <ScoreBar
                    label="Correctness (50%)"
                    value={result.correctness}
                  />
                  <ScoreBar
                    label="Efficiency (30%)"
                    value={result.interventionEfficiency}
                  />
                  <ScoreBar
                    label="Diagnosis (20%)"
                    value={result.diagnosisQuality}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  Back to Challenges
                </Button>
              </Link>
              <Link href="/leaderboard" className="flex-1">
                <Button className="w-full">View Leaderboard</Button>
              </Link>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  const clampedValue = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={bold ? "font-bold" : "text-muted-foreground"}>
          {label}
        </span>
        <span className={`font-mono ${bold ? "font-bold text-lg" : ""}`}>
          {value.toFixed(1)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
