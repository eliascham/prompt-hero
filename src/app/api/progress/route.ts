import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/app/api/_helpers/supabase-helpers";
import { determineRank } from "@/lib/scoring";
import type { ScoreRank } from "@/lib/types";

interface ProgressEntry {
  bestScore: number;
  bestRank: ScoreRank;
  completedAt: string;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const userId = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!userId) {
    return NextResponse.json(
      { error: "Authorization required" },
      { status: 401 },
    );
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("scores")
    .select("challenge_id, total_score, correctness, intervention_efficiency, created_at")
    .eq("user_id", userId)
    .order("total_score", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load progress" },
      { status: 500 },
    );
  }

  // Group by challenge_id, keep best score per challenge
  const completed: Record<string, ProgressEntry> = {};
  for (const row of data ?? []) {
    const cid = row.challenge_id;
    if (!completed[cid] || row.total_score > completed[cid].bestScore) {
      completed[cid] = {
        bestScore: row.total_score ?? 0,
        bestRank: determineRank(
          row.total_score ?? 0,
          row.correctness ?? 0,
          row.intervention_efficiency ?? 0,
        ),
        completedAt: row.created_at,
      };
    }
  }

  return NextResponse.json({ completed });
}
