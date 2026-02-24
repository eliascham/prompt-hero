import { inngest } from "./client";
import { getServerSupabase } from "@/app/api/_helpers/supabase-helpers";
import type { Database } from "../db/database.types";
import {
  calculateCorrectness,
  calculateEfficiency,
  calculateDiagnosisQuality,
  calculateTotalScore,
  determineRank,
} from "../scoring";
import type { Challenge, TestResult } from "../types";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type ChallengeRow = Database["public"]["Tables"]["challenges"]["Row"];
type ScoreRow = Database["public"]["Tables"]["scores"]["Row"];

export const scoreSession = inngest.createFunction(
  { id: "score-session", name: "Score Session" },
  { event: "session/completed" },
  async ({ event }) => {
    const { sessionId, postMortem } = event.data as {
      sessionId: string;
      postMortem: string;
    };

    const db = getServerSupabase();

    // Load session
    const { data: rawSession, error: sessionError } = await db
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !rawSession) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const session = rawSession as unknown as SessionRow;

    // Idempotency: skip if session already has a score
    const { data: existingScore } = await db
      .from("scores")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existingScore) {
      return { skipped: true, reason: "Score already exists" };
    }

    // Load challenge
    const { data: rawChallenge, error: challengeError } = await db
      .from("challenges")
      .select("*")
      .eq("id", session.challenge_id)
      .single();

    if (challengeError || !rawChallenge) {
      throw new Error(`Challenge not found: ${session.challenge_id}`);
    }

    const challenge = rawChallenge as unknown as ChallengeRow;

    const testResults = (session.test_results || []) as unknown as TestResult[];
    const userMessages = (
      (session.messages || []) as unknown as { role: string }[]
    ).filter((m) => m.role === "user");

    const correctness = calculateCorrectness(testResults);
    const efficiency = calculateEfficiency(
      session.reveals_used,
      userMessages.length,
    );
    const diagnosis = calculateDiagnosisQuality(postMortem, {
      id: challenge.id,
      title: challenge.title,
      difficulty: (challenge.difficulty as Challenge["difficulty"]) ?? "medium",
      tags: challenge.tags ?? [],
      truthSpec: challenge.truth_spec as unknown as Challenge["truthSpec"],
      aiBrief: challenge.ai_brief as unknown as Challenge["aiBrief"],
      starterCode: challenge.starter_code ?? {},
      meta: (challenge.meta as unknown as Challenge["meta"]) ?? {
        estimatedMinutes: 30,
        optimalMessages: 5,
        optimalReveals: 0,
        flawTypes: [],
      },
    });
    const totalScore = calculateTotalScore(correctness, efficiency, diagnosis);
    const rank = determineRank(
      totalScore,
      correctness,
      session.reveals_used,
      efficiency,
    );

    // Save score
    const { data: rawScore, error: scoreError } = await db
      .from("scores")
      .insert({
        session_id: sessionId,
        user_id: session.user_id!,
        challenge_id: session.challenge_id,
        correctness,
        intervention_efficiency: efficiency,
        diagnosis_quality: diagnosis,
        total_score: totalScore,
        post_mortem: postMortem,
      })
      .select()
      .single();

    if (scoreError) {
      throw new Error(`Failed to save score: ${scoreError.message}`);
    }

    const score = rawScore as unknown as ScoreRow;

    // Mark session as completed
    await db
      .from("sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      } as Database["public"]["Tables"]["sessions"]["Update"])
      .eq("id", sessionId);

    return {
      scoreId: score.id,
      correctness,
      interventionEfficiency: efficiency,
      diagnosisQuality: diagnosis,
      totalScore,
      rank,
    };
  },
);
