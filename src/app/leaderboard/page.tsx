"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ScoreRank } from "@/lib/types";

type ScoreRow = Database["public"]["Tables"]["scores"]["Row"];
type ChallengeRow = Database["public"]["Tables"]["challenges"]["Row"];

interface LeaderboardEntry {
  id: string;
  session_id: string;
  user_id: string;
  challenge_id: string;
  correctness: number;
  intervention_efficiency: number;
  diagnosis_quality: number;
  total_score: number;
  created_at: string;
  username: string;
  challenge_title: string;
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

const PAGE_SIZE = 20;

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [challenges, setChallenges] = useState<{ id: string; title: string }[]>(
    [],
  );
  const [selectedChallenge, setSelectedChallenge] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("total_score");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("challenges")
      .select("id, title")
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as Pick<ChallengeRow, "id" | "title">[];
        setChallenges(rows);
      });
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("scores")
      .select("*", { count: "exact" })
      .order(sortBy, { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (selectedChallenge !== "all") {
      query = query.eq("challenge_id", selectedChallenge);
    }

    const { data: rawData, count } = await query;
    const data = (rawData ?? []) as unknown as ScoreRow[];

    if (data.length > 0) {
      const userIds = [...new Set(data.map((d) => d.user_id))];
      const challengeIds = [...new Set(data.map((d) => d.challenge_id))];

      const challengeMap = new Map<string, string>();
      if (challengeIds.length > 0) {
        const { data: rawChallengeData } = await supabase
          .from("challenges")
          .select("id, title")
          .in("id", challengeIds);
        const challengeData = (rawChallengeData ?? []) as unknown as Pick<ChallengeRow, "id" | "title">[];
        challengeData.forEach((c) => challengeMap.set(c.id, c.title));
      }

      const usernameMap = new Map<string, string>();
      userIds.forEach((uid) => {
        usernameMap.set(uid, uid.slice(0, 8));
      });

      const enriched: LeaderboardEntry[] = data.map((d) => ({
        id: d.id,
        session_id: d.session_id,
        user_id: d.user_id,
        challenge_id: d.challenge_id,
        correctness: d.correctness ?? 0,
        intervention_efficiency: d.intervention_efficiency ?? 0,
        diagnosis_quality: d.diagnosis_quality ?? 0,
        total_score: d.total_score ?? 0,
        created_at: d.created_at,
        username: usernameMap.get(d.user_id) ?? "anonymous",
        challenge_title: challengeMap.get(d.challenge_id) ?? d.challenge_id,
      }));

      setEntries(enriched);
      setTotalCount(count ?? 0);
    } else {
      setEntries([]);
      setTotalCount(0);
    }

    setLoading(false);
  }, [selectedChallenge, sortBy, page]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="dark min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
          <Link href="/">
            <Button variant="outline" size="sm">
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-4">
              <CardTitle className="text-lg">Filters</CardTitle>
              <Select
                value={selectedChallenge}
                onValueChange={(v) => {
                  setSelectedChallenge(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="All challenges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All challenges</SelectItem>
                  {challenges.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(v) => {
                  setSortBy(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total_score">Total Score</SelectItem>
                  <SelectItem value="correctness">Correctness</SelectItem>
                  <SelectItem value="intervention_efficiency">
                    Efficiency
                  </SelectItem>
                  <SelectItem value="diagnosis_quality">Diagnosis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-muted-foreground">
                Loading...
              </p>
            ) : entries.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No scores yet. Be the first!
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Challenge</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Rank</TableHead>
                      <TableHead className="text-right">Correct</TableHead>
                      <TableHead className="text-right">Efficiency</TableHead>
                      <TableHead className="text-right">Diagnosis</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, i) => {
                      const rank = computeRank(
                        entry.total_score,
                        entry.correctness,
                        entry.intervention_efficiency,
                      );
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-mono text-muted-foreground">
                            {page * PAGE_SIZE + i + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.username}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {entry.challenge_title}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {entry.total_score.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={RANK_COLORS[rank]}
                            >
                              {rank}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {entry.correctness.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {entry.intervention_efficiency.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {entry.diagnosis_quality.toFixed(1)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
