import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServerSupabase } from "@/app/api/_helpers/supabase-helpers";
import { getCachedSession, cacheSession } from "@/lib/redis";
import { buildSystemPrompt } from "@/engine/prompt-builder";
import { checkSimilarity } from "@/engine/similarity";
import {
  filterTestFeedbackForHuman,
  filterTestFeedbackForAI,
} from "@/engine/feedback-filter";
import { loadChallenge, loadChallengeTestFiles } from "@/app/api/_helpers/challenge-loader";
import { executeTool } from "@/engine/tool-executor";
import type {
  ChatRequest,
  Session,
  ChatMessage,
  SSEEventType,
  Reveal,
} from "@/lib/types";

const MIN_MESSAGE_LENGTH = 1;
const MAX_MESSAGE_LENGTH = 500;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "run_tests",
    description:
      "Run the project test suite. Returns test results with pass/fail status.",
    input_schema: {
      type: "object" as const,
      properties: {
        filter: {
          type: "string",
          description: "Optional test name filter",
        },
      },
      required: [],
    },
  },
  {
    name: "read_file",
    description: "Read the contents of a file in the project.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "File path to read" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file in the project.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "File path to write" },
        content: { type: "string", description: "File content" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "run_command",
    description: "Run a shell command in the project directory.",
    input_schema: {
      type: "object" as const,
      properties: {
        command: { type: "string", description: "Shell command to execute" },
      },
      required: ["command"],
    },
  },
];

function sseEncode(event: SSEEventType, data: unknown): string {
  return `data: ${JSON.stringify({ type: event, data })}\n\n`;
}

async function loadSession(sessionId: string): Promise<Session | null> {
  const cached = await getCachedSession(sessionId);
  if (cached) return cached as Session;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !data) return null;

  return {
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

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ChatRequest;
  const { sessionId, message } = body;

  // Validate inputs
  if (!sessionId || !message) {
    return new Response(
      JSON.stringify({ error: "sessionId and message are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate character length
  if (message.length < MIN_MESSAGE_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
    return new Response(
      JSON.stringify({
        error: `Message must be between ${MIN_MESSAGE_LENGTH} and ${MAX_MESSAGE_LENGTH} characters`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Load session
  const session = await loadSession(sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (session.status !== "active") {
    return new Response(JSON.stringify({ error: "Session is not active" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Load challenge for truth spec + AI brief
  const challenge = await loadChallenge(session.challengeId);
  if (!challenge) {
    return new Response(JSON.stringify({ error: "Challenge not found" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check similarity against truth spec
  const similarity = checkSimilarity(message, challenge.truthSpec);
  if (similarity.blocked) {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(
          encoder.encode(
            sseEncode("similarity_blocked", {
              score: similarity.score,
              message:
                "Your message is too similar to the truth specification. Please rephrase.",
            })
          )
        );
        controller.enqueue(encoder.encode(sseEncode("done", {})));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Add user message to session
  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
  };
  session.messages.push(userMessage);

  // Extract reveals from system messages
  const reveals: Reveal[] = session.messages
    .filter(
      (m) =>
        m.role === "system" &&
        m.content.startsWith("Updated requirement from stakeholder:")
    )
    .map((m) => ({
      snippet: m.content.replace(
        "Updated requirement from stakeholder: ",
        ""
      ),
      injectedAs: m.content,
      timestamp: m.timestamp,
    }));

  // Load test files for sandbox execution
  const testFiles = await loadChallengeTestFiles(session.challengeId);

  // Build system prompt using AI brief (NEVER truth spec)
  const systemPrompt = buildSystemPrompt(challenge.aiBrief, reveals);

  // Build conversation history for Anthropic API
  const anthropicMessages: Anthropic.MessageParam[] = session.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // SSE streaming response with agentic tool-use loop.
  // Claude may call tools and expect results before continuing.
  // We loop: stream response → execute tools → feed results back → repeat.
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const anthropic = new Anthropic();
        const MAX_TOOL_ROUNDS = 10;

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: systemPrompt,
            messages: anthropicMessages,
            tools: TOOLS,
            stream: true,
          });

          // Per-round accumulators
          let fullText = "";
          let currentBlockText = "";
          let currentToolUse: {
            id: string;
            name: string;
            inputJson: string;
          } | null = null;
          let stopReason: string | null = null;

          // Content blocks for the assistant message (for API continuation)
          const assistantContent: Array<
            | { type: "text"; text: string }
            | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
          > = [];

          // Tool results for feeding back to the API
          const toolResultBlocks: Array<{
            type: "tool_result";
            tool_use_id: string;
            content: string;
          }> = [];

          for await (const event of response) {
            switch (event.type) {
              case "content_block_start": {
                if (event.content_block.type === "text") {
                  currentBlockText = "";
                } else if (event.content_block.type === "tool_use") {
                  currentToolUse = {
                    id: event.content_block.id,
                    name: event.content_block.name,
                    inputJson: "",
                  };
                  controller.enqueue(
                    encoder.encode(
                      sseEncode("tool_call", {
                        toolId: event.content_block.id,
                        name: event.content_block.name,
                      })
                    )
                  );
                }
                break;
              }
              case "content_block_delta": {
                if (event.delta.type === "text_delta") {
                  currentBlockText += event.delta.text;
                  fullText += event.delta.text;
                  controller.enqueue(
                    encoder.encode(
                      sseEncode("ai_message", { text: event.delta.text })
                    )
                  );
                } else if (event.delta.type === "input_json_delta") {
                  if (currentToolUse) {
                    currentToolUse.inputJson += event.delta.partial_json;
                  }
                }
                break;
              }
              case "content_block_stop": {
                if (currentToolUse) {
                  // Tool block ended — parse, execute, collect result
                  const toolInput = currentToolUse.inputJson
                    ? JSON.parse(currentToolUse.inputJson)
                    : {};

                  assistantContent.push({
                    type: "tool_use",
                    id: currentToolUse.id,
                    name: currentToolUse.name,
                    input: toolInput,
                  });

                  const result = await executeTool(
                    session.id,
                    currentToolUse.name,
                    toolInput,
                    challenge.starterCode,
                    testFiles,
                  );

                  // Stream tool result to client
                  controller.enqueue(
                    encoder.encode(
                      sseEncode("tool_result", {
                        toolId: currentToolUse.id,
                        name: currentToolUse.name,
                        output: result.output,
                      })
                    )
                  );

                  // Stream test feedback if present
                  if (result.testResults) {
                    for (const tr of result.testResults) {
                      controller.enqueue(
                        encoder.encode(
                          sseEncode("test_feedback_human", filterTestFeedbackForHuman(tr))
                        )
                      );
                      controller.enqueue(
                        encoder.encode(
                          sseEncode("test_feedback_ai", filterTestFeedbackForAI(tr))
                        )
                      );
                    }
                  }

                  // Track tool call in session
                  session.toolCalls.push({
                    id: currentToolUse.id,
                    name: currentToolUse.name as
                      | "run_tests"
                      | "read_file"
                      | "write_file"
                      | "run_command",
                    input: toolInput,
                    output: result.output,
                    timestamp: new Date().toISOString(),
                  });

                  if (result.testResults) {
                    session.testResults.push(...result.testResults);
                  }

                  // Send code_update for write_file
                  if (currentToolUse.name === "write_file") {
                    controller.enqueue(
                      encoder.encode(
                        sseEncode("code_update", {
                          path: toolInput.path,
                          content: toolInput.content,
                        })
                      )
                    );
                  }

                  // Collect for API continuation
                  toolResultBlocks.push({
                    type: "tool_result",
                    tool_use_id: currentToolUse.id,
                    content: result.output,
                  });

                  currentToolUse = null;
                } else {
                  // Text block ended
                  if (currentBlockText) {
                    assistantContent.push({
                      type: "text",
                      text: currentBlockText,
                    });
                  }
                  currentBlockText = "";
                }
                break;
              }
              case "message_delta": {
                if ("stop_reason" in event.delta) {
                  stopReason = event.delta.stop_reason;
                }
                break;
              }
              case "message_stop": {
                // Store full assistant text in session history
                if (fullText) {
                  session.messages.push({
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: fullText,
                    timestamp: new Date().toISOString(),
                  });
                }
                break;
              }
            }
          }

          // If Claude wants to continue after tool use, feed results back
          if (stopReason === "tool_use" && toolResultBlocks.length > 0) {
            anthropicMessages.push({
              role: "assistant",
              content: assistantContent as Anthropic.MessageParam["content"],
            });
            anthropicMessages.push({
              role: "user",
              content: toolResultBlocks as unknown as Anthropic.MessageParam["content"],
            });
            // Continue to next round
          } else {
            // Done — end_turn, max_tokens, or no more tool calls
            break;
          }
        }

        // Send done event
        controller.enqueue(encoder.encode(sseEncode("done", {})));

        // Persist session updates
        const supabase = getServerSupabase();
        await supabase
          .from("sessions")
          .update({
            messages: session.messages,
            tool_calls: session.toolCalls,
            test_results: session.testResults,
          })
          .eq("id", sessionId);

        await cacheSession(sessionId, session);
      } catch (err) {
        console.error("Chat streaming error:", err);
        controller.enqueue(
          encoder.encode(
            sseEncode("ai_message", {
              text: "An error occurred while processing your message. Please try again.",
            })
          )
        );
        controller.enqueue(encoder.encode(sseEncode("done", {})));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
