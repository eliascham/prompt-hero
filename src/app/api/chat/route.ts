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
import { loadChallenge } from "@/app/api/_helpers/challenge-loader";
import type {
  ChatRequest,
  Session,
  ChatMessage,
  SSEEventType,
  Reveal,
  TestResult,
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
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Mock tool execution — returns plausible responses.
 * Will be replaced by E2B sandbox integration later.
 */
function mockToolExecution(
  toolName: string,
  input: Record<string, unknown>,
  starterFiles: Record<string, string>
): { output: string; testResults?: TestResult[] } {
  switch (toolName) {
    case "read_file": {
      const path = input.path as string;
      const content = starterFiles[path];
      if (content) {
        return { output: content };
      }
      return { output: `Error: File not found: ${path}` };
    }
    case "write_file": {
      const path = input.path as string;
      // Track the write (in a real implementation, this updates the sandbox)
      starterFiles[path] = input.content as string;
      return { output: `Successfully wrote to ${path}` };
    }
    case "run_tests": {
      const results: TestResult[] = [
        {
          passed: true,
          testName: "basic functionality",
          category: "core",
          direction: "passing",
          rawOutput: "Test passed: basic functionality works as expected",
          timestamp: new Date().toISOString(),
        },
        {
          passed: false,
          testName: "edge case handling",
          category: "edge-cases",
          direction: "output format incorrect",
          rawOutput:
            'Expected output to match format "key: value" but received "key=value"',
          timestamp: new Date().toISOString(),
        },
      ];
      return {
        output: `2 tests run: 1 passed, 1 failed`,
        testResults: results,
      };
    }
    case "run_command": {
      return { output: `$ ${input.command}\nCommand executed successfully.` };
    }
    default:
      return { output: "Unknown tool" };
  }
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

  // Build system prompt using AI brief (NEVER truth spec)
  const systemPrompt = buildSystemPrompt(challenge.aiBrief, reveals);

  // Build conversation history for Anthropic API
  const anthropicMessages: Anthropic.MessageParam[] = session.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // SSE streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const anthropic = new Anthropic();

        // Call Anthropic API with streaming
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-6-20250514",
          max_tokens: 4096,
          system: systemPrompt,
          messages: anthropicMessages,
          tools: TOOLS,
          stream: true,
        });

        let currentText = "";
        let currentToolUse: {
          id: string;
          name: string;
          inputJson: string;
        } | null = null;

        for await (const event of response) {
          switch (event.type) {
            case "content_block_start": {
              if (event.content_block.type === "text") {
                currentText = "";
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
                currentText += event.delta.text;
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
                // Parse tool input and execute mock
                const toolInput = currentToolUse.inputJson
                  ? JSON.parse(currentToolUse.inputJson)
                  : {};

                const result = mockToolExecution(
                  currentToolUse.name,
                  toolInput,
                  challenge.starterCode
                );

                // Send tool result
                controller.enqueue(
                  encoder.encode(
                    sseEncode("tool_result", {
                      toolId: currentToolUse.id,
                      name: currentToolUse.name,
                      output: result.output,
                    })
                  )
                );

                // If test results, send filtered feedback
                if (result.testResults) {
                  for (const tr of result.testResults) {
                    controller.enqueue(
                      encoder.encode(
                        sseEncode(
                          "test_feedback_human",
                          filterTestFeedbackForHuman(tr)
                        )
                      )
                    );
                    controller.enqueue(
                      encoder.encode(
                        sseEncode(
                          "test_feedback_ai",
                          filterTestFeedbackForAI(tr)
                        )
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

                // Track test results
                if (result.testResults) {
                  session.testResults.push(...result.testResults);
                }

                // If write_file, send code_update
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

                currentToolUse = null;
              }
              break;
            }
            case "message_stop": {
              // Store assistant response
              if (currentText) {
                session.messages.push({
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: currentText,
                  timestamp: new Date().toISOString(),
                });
              }
              break;
            }
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
