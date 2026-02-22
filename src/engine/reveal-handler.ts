import { getServerSupabase } from "@/app/api/_helpers/supabase-helpers";
import { getCachedSession, cacheSession } from "@/lib/redis";
import type { Session, Reveal } from "@/lib/types";

export async function processReveal(
  sessionId: string,
  snippet: string
): Promise<{ injectedAs: string; revealsRemaining: number }> {
  // Load session from cache or DB
  const supabase = getServerSupabase();
  let session: Session | null = await getCachedSession(sessionId);

  if (!session) {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
    if (error || !data) {
      throw new Error("Session not found");
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

  // Validate reveals remaining
  const remaining = session.maxReveals - session.revealsUsed;
  if (remaining <= 0) {
    throw new Error("No reveals remaining");
  }

  // Build injected text
  const injectedAs = `Updated requirement from stakeholder: ${snippet}`;

  // Create reveal record
  const reveal: Reveal = {
    snippet,
    injectedAs,
    timestamp: new Date().toISOString(),
  };

  // Update session in DB
  const newRevealsUsed = session.revealsUsed + 1;
  const { error: updateError } = await supabase
    .from("sessions")
    .update({ reveals_used: newRevealsUsed })
    .eq("id", sessionId);

  if (updateError) {
    throw new Error("Failed to update session reveals");
  }

  // Update cache
  session.revealsUsed = newRevealsUsed;
  await cacheSession(sessionId, session);

  // Store reveal in session messages as a system message
  const revealMessage = {
    id: crypto.randomUUID(),
    role: "system" as const,
    content: injectedAs,
    timestamp: reveal.timestamp,
  };
  await supabase
    .from("sessions")
    .update({
      messages: [...session.messages, revealMessage],
    })
    .eq("id", sessionId);

  return {
    injectedAs,
    revealsRemaining: session.maxReveals - newRevealsUsed,
  };
}
