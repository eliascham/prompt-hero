import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/app/api/_helpers/supabase-helpers";
import { getCachedSession } from "@/lib/redis";
import type {
  ScoreRequest,
  ScoreResponse,
  ScoreRank,
  Session,
  TestResult,
} from "@/lib/types";

function computeRank(totalScore: number): ScoreRank {
  if (totalScore >= 95) return "S";
  if (totalScore >= 85) return "A";
  if (totalScore >= 70) return "B";
  if (totalScore >= 55) return "C";
  if (totalScore >= 40) return "D";
  return "F";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ScoreRequest;
    const { sessionId, postMortem } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Load session
    const supabase = getServerSupabase();
    let session: Session | null = await getCachedSession(sessionId);

    if (!session) {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (error || !data) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
      session = {
        id: data.id,
        userId: data.user_id,
        challengeId: data.challenge_id,
        status: data.status as Session["status"],
        revealsUsed: data.reveals_used,
        maxReveals: data.max_reveals,
        messages: data.messages as Session["messages"],
        toolCalls: data.tool_calls as Session["toolCalls"],
        testResults: data.test_results as Session["testResults"],
        createdAt: data.created_at,
        completedAt: data.completed_at,
      };
    }

    // Compute correctness from test results
    const testResults = session.testResults as TestResult[];
    const totalTests = testResults.length;
    const passedTests = testResults.filter((t) => t.passed).length;
    const correctness =
      totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Compute intervention efficiency
    const userMessages = session.messages.filter((m) => m.role === "user");
    const interventionEfficiency = Math.max(
      0,
      100 - session.revealsUsed * 15 - userMessages.length * 2
    );

    // Diagnosis quality — placeholder (Arbiter will implement full version)
    const diagnosisQuality = postMortem ? 70 : 0;

    // Weighted total
    const totalScore =
      correctness * 0.5 +
      interventionEfficiency * 0.3 +
      diagnosisQuality * 0.2;

    const rank = computeRank(totalScore);

    // Save score to DB
    await supabase.from("scores").insert({
      session_id: sessionId,
      user_id: session.userId ?? "anonymous",
      challenge_id: session.challengeId,
      correctness,
      intervention_efficiency: interventionEfficiency,
      diagnosis_quality: diagnosisQuality,
      total_score: totalScore,
      post_mortem: postMortem,
    });

    // Mark session completed
    await supabase
      .from("sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", sessionId);

    const response: ScoreResponse = {
      correctness,
      interventionEfficiency: interventionEfficiency,
      diagnosisQuality,
      totalScore,
      rank,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("POST /api/score error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
