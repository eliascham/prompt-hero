"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db";
import type { Database } from "@/lib/db/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ScoreRank } from "@/lib/types";

type ScoreRow = Database["public"]["Tables"]["scores"]["Row"];
type ChallengeRow = Database["public"]["Tables"]["challenges"]["Row"];

interface UserScore {
  id: string;
  challenge_id: string;
  challenge_title: string;
  correctness: number;
  intervention_efficiency: number;
  diagnosis_quality: number;
  total_score: number;
  rank: ScoreRank;
  created_at: string;
}

interface UserProfile {
  email: string;
  username: string;
}

const RANK_COLORS: Record<ScoreRank, string> = {
  S: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  A: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  B: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  C: "bg-green-500/20 text-green-400 border-green-500/50",
  D: "bg-gray-500/20 text-gray-400 border-gray-500/50",
  F: "bg-red-500/20 text-red-400 border-red-500/50",
};

function computeRank(
  totalScore: number,
  correctness: number,
  efficiency: number,
): ScoreRank {
  if (totalScore >= 95 && correctness === 100 && efficiency > 80) return "S";
  if (totalScore >= 85) return "A";
  if (totalScore >= 70) return "B";
  if (totalScore >= 55) return "C";
  if (totalScore >= 40) return "D";
  return "F";
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scores, setScores] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setProfile({
        email: user.email ?? "",
        username:
          (user.user_metadata?.username as string) ??
          user.email?.split("@")[0] ??
          "anonymous",
      });

      // Load scores
      const { data: rawScoreData } = await supabase
        .from("scores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const scoreData = (rawScoreData ?? []) as unknown as ScoreRow[];

      if (scoreData.length > 0) {
        const challengeIds = [
          ...new Set(scoreData.map((s) => s.challenge_id)),
        ];
        const challengeMap = new Map<string, string>();

        if (challengeIds.length > 0) {
          const { data: rawChallengeData } = await supabase
            .from("challenges")
            .select("id, title")
            .in("id", challengeIds);
          const challengeData = (rawChallengeData ?? []) as unknown as Pick<ChallengeRow, "id" | "title">[];
          challengeData.forEach((c) => challengeMap.set(c.id, c.title));
        }

        setScores(
          scoreData.map((s) => {
            const rank = computeRank(
              s.total_score ?? 0,
              s.correctness ?? 0,
              s.intervention_efficiency ?? 0,
            );
            return {
              id: s.id,
              challenge_id: s.challenge_id,
              challenge_title:
                challengeMap.get(s.challenge_id) ?? s.challenge_id,
              correctness: s.correctness ?? 0,
              intervention_efficiency: s.intervention_efficiency ?? 0,
              diagnosis_quality: s.diagnosis_quality ?? 0,
              total_score: s.total_score ?? 0,
              rank,
              created_at: s.created_at,
            };
          }),
        );
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!profile) return null;

  const avgScore =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length
      : 0;

  const bestRankOrder: ScoreRank[] = ["S", "A", "B", "C", "D", "F"];
  const bestRank =
    scores.length > 0
      ? scores.reduce((best, s) => {
          return bestRankOrder.indexOf(s.rank) <
            bestRankOrder.indexOf(best)
            ? s.rank
            : best;
        }, "F" as ScoreRank)
      : null;

  return (
    <div className="dark min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <div className="flex gap-2">
            <Link href="/leaderboard">
              <Button variant="outline" size="sm">
                Leaderboard
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                Home
              </Button>
            </Link>
          </div>
        </div>

        {/* User Info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {profile.username[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold">{profile.username}</p>
                <p className="text-sm text-muted-foreground">
                  {profile.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{scores.length}</p>
              <p className="text-sm text-muted-foreground">
                Challenges Completed
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{avgScore.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6 text-center">
              {bestRank ? (
                <Badge
                  variant="outline"
                  className={`text-2xl px-3 py-1 ${RANK_COLORS[bestRank]}`}
                >
                  {bestRank}
                </Badge>
              ) : (
                <p className="text-3xl font-bold">-</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">Best Rank</p>
            </CardContent>
          </Card>
        </div>

        {/* Score History */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Score History</CardTitle>
          </CardHeader>
          <CardContent>
            {scores.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                No completed challenges yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Challenge</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Rank</TableHead>
                    <TableHead className="text-right">Correct</TableHead>
                    <TableHead className="text-right">Efficiency</TableHead>
                    <TableHead className="text-right">Diagnosis</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.challenge_title}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {s.total_score.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={RANK_COLORS[s.rank]}
                        >
                          {s.rank}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {s.correctness.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {s.intervention_efficiency.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {s.diagnosis_quality.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
