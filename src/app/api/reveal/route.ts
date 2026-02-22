import { NextRequest, NextResponse } from "next/server";
import { processReveal } from "@/engine/reveal-handler";
import type { RevealRequest, RevealResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RevealRequest;
    const { sessionId, snippet } = body;

    if (!sessionId || !snippet) {
      return NextResponse.json(
        { error: "sessionId and snippet are required" },
        { status: 400 }
      );
    }

    const result = await processReveal(sessionId, snippet);

    const response: RevealResponse = {
      revealsRemaining: result.revealsRemaining,
      injectedAs: result.injectedAs,
    };

    return NextResponse.json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    const status = message === "No reveals remaining" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
