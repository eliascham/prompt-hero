import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/app/api/_helpers/supabase-helpers";
import { getCachedSession } from "@/lib/redis";
import { loadChallenge } from "@/app/api/_helpers/challenge-loader";
import {
  calculateCorrectness,
  calculateEfficiency,
  calculateDiagnosisQuality,
  calculateTotalScore,
  determineRank,
} from "@/lib/scoring";
import { inngest } from "@/lib/inngest/client";
import type { ScoreRequest, ScoreResponse, Session } from "@/lib/types";

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

    // Optional auth: extract user from Authorization header if present
    const authHeader = request.headers.get("authorization");
    const headerUserId = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

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
        messages: data.messages as Session["messages"],
        toolCalls: data.tool_calls as Session["toolCalls"],
        testResults: data.test_results as Session["testResults"],
        createdAt: data.created_at,
        completedAt: data.completed_at,
      };
    }

    // Load challenge for diagnosis quality scoring
    const challenge = await loadChallenge(session.challengeId);
    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 500 }
      );
    }

    // Use scoring.ts functions
    const correctness = calculateCorrectness(session.testResults);
    const userMessages = session.messages.filter((m) => m.role === "user");
    const interventionEfficiency = calculateEfficiency(
      userMessages.length,
    );
    const diagnosisQuality = postMortem
      ? calculateDiagnosisQuality(postMortem, challenge)
      : 0;
    const totalScore = calculateTotalScore(
      correctness,
      interventionEfficiency,
      diagnosisQuality,
    );
    const rank = determineRank(
      totalScore,
      correctness,
      interventionEfficiency,
    );

    const userId = headerUserId ?? session.userId;

    // Save score to DB
    await supabase.from("scores").insert({
      session_id: sessionId,
      user_id: userId,
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

    // Fire Inngest event for async scoring (non-fatal on failure)
    try {
      await inngest.send({
        name: "session/completed",
        data: { sessionId, postMortem },
      });
    } catch {
      // Non-fatal: async scoring is best-effort
    }

    const response: ScoreResponse = {
      correctness,
      interventionEfficiency,
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
