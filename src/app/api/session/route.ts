import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/app/api/_helpers/supabase-helpers";
import { cacheSession } from "@/lib/redis";
import { loadChallenge } from "@/app/api/_helpers/challenge-loader";
import type { CreateSessionRequest, CreateSessionResponse, Session } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateSessionRequest;
    const { challengeId } = body;

    if (!challengeId) {
      return NextResponse.json(
        { error: "challengeId is required" },
        { status: 400 }
      );
    }

    // Optional auth: extract user from Authorization header if present
    const authHeader = request.headers.get("authorization");
    const userId = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    // Load challenge
    const challenge = await loadChallenge(challengeId);
    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Create session in DB
    const supabase = getServerSupabase();
    const { data: sessionData, error } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        status: "active",
        messages: [],
        tool_calls: [],
        test_results: [],
      })
      .select("id, created_at")
      .single();

    if (error || !sessionData) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // Build session object for cache
    const session: Session = {
      id: sessionData.id,
      userId,
      challengeId,
      status: "active",
      messages: [],
      toolCalls: [],
      testResults: [],
      createdAt: sessionData.created_at,
      completedAt: null,
    };

    // Cache session in Redis
    await cacheSession(session.id, session);

    // Response — aiBrief is NEVER sent to client
    const response: CreateSessionResponse = {
      sessionId: session.id,
      challenge: {
        id: challenge.id,
        title: challenge.title,
        tags: challenge.tags,
        truthSpec: challenge.truthSpec,
        starterFiles: challenge.starterCode,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("POST /api/session error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
