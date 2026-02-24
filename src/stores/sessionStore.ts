import { create } from "zustand";
import type {
  ChatMessage,
  CreateSessionResponse,
  SSEEventType,
  TruthSpec,
  ToolCallRecord,
  TestResult,
  ScoreResponse,
} from "@/lib/types";

/** crypto.randomUUID() needs secure context (HTTPS/localhost). Fallback for HTTP. */
function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

interface SessionState {
  sessionId: string | null;
  challengeId: string | null;
  challenge: {
    id: string;
    title: string;
    tags: string[];
    truthSpec: TruthSpec;
    starterFiles: Record<string, string>;
  } | null;
  status: "idle" | "active" | "completed";
  revealsUsed: number;
  maxReveals: number;
  messages: ChatMessage[];
  toolCalls: ToolCallRecord[];
  testResults: TestResult[];
  isLoading: boolean;
  isStreaming: boolean;
  score: ScoreResponse | null;
  error: string | null;

  createSession: (challengeId: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  requestReveal: (snippet: string) => Promise<void>;
  completeSession: (postMortem: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  challengeId: null,
  challenge: null,
  status: "idle" as const,
  revealsUsed: 0,
  maxReveals: 3,
  messages: [],
  toolCalls: [],
  testResults: [],
  isLoading: false,
  isStreaming: false,
  score: null,
  error: null,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,

  createSession: async (challengeId: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      const data: CreateSessionResponse = await res.json();
      set({
        sessionId: data.sessionId,
        challengeId: data.challenge.id,
        challenge: data.challenge,
        maxReveals: data.revealBudget,
        revealsUsed: 0,
        status: "active",
        messages: [],
        toolCalls: [],
        testResults: [],
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : "Failed to create session" });
    }
  },

  sendMessage: async (text: string) => {
    const { sessionId } = get();
    if (!sessionId) return;

    const userMsg: ChatMessage = {
      id: uuid(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    set((s) => ({
      messages: [...s.messages, userMsg],
      isStreaming: true,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });

      if (!res.ok || !res.body) {
        set({ isStreaming: false });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";
      let aiMsgId = uuid();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          try {
            const evt: { type: SSEEventType; data: unknown } = JSON.parse(raw);
            switch (evt.type) {
              case "ai_message": {
                aiContent += (evt.data as { text: string }).text;
                set((s) => {
                  const msgs = [...s.messages];
                  const idx = msgs.findIndex((m) => m.id === aiMsgId);
                  const aiMsg: ChatMessage = {
                    id: aiMsgId,
                    role: "assistant",
                    content: aiContent,
                    timestamp: new Date().toISOString(),
                  };
                  if (idx >= 0) {
                    msgs[idx] = aiMsg;
                  } else {
                    msgs.push(aiMsg);
                  }
                  return { messages: msgs };
                });
                break;
              }
              case "tool_call": {
                const tc = evt.data as { toolId: string; name: string };
                set((s) => ({
                  toolCalls: [
                    ...s.toolCalls,
                    {
                      id: tc.toolId,
                      name: tc.name as ToolCallRecord["name"],
                      input: {},
                      output: "",
                      timestamp: new Date().toISOString(),
                    },
                  ],
                }));
                break;
              }
              case "tool_result": {
                const tr = evt.data as { toolId: string; output: string };
                set((s) => ({
                  toolCalls: s.toolCalls.map((tc) =>
                    tc.id === tr.toolId ? { ...tc, output: tr.output } : tc
                  ),
                }));
                break;
              }
              case "test_feedback_human": {
                const tf = evt.data as TestResult;
                set((s) => ({ testResults: [...s.testResults, tf] }));
                break;
              }
              case "test_feedback_ai": {
                // No-op on client — this event is for the AI only
                break;
              }
              case "code_update": {
                const cu = evt.data as { path: string; content: string };
                // Update codeStore directly
                const { useCodeStore } = await import("@/stores/codeStore");
                useCodeStore.getState().updateFile(cu.path, cu.content);
                break;
              }
              case "similarity_blocked": {
                const sysMsg: ChatMessage = {
                  id: uuid(),
                  role: "system",
                  content:
                    "Message blocked: too similar to the truth specification. Try rephrasing in your own words.",
                  timestamp: new Date().toISOString(),
                };
                set((s) => ({ messages: [...s.messages, sysMsg] }));
                break;
              }
              case "done": {
                aiMsgId = uuid();
                aiContent = "";
                break;
              }
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } finally {
      set({ isStreaming: false });
    }
  },

  requestReveal: async (snippet: string) => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isLoading: true });
    try {
      const res = await fetch("/api/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, snippet }),
      });
      const data = await res.json();
      set({
        revealsUsed: get().maxReveals - data.revealsRemaining,
        isLoading: false,
      });

      const sysMsg: ChatMessage = {
        id: uuid(),
        role: "system",
        content: `Reveal sent to AI as: "${data.injectedAs}"`,
        timestamp: new Date().toISOString(),
      };
      set((s) => ({ messages: [...s.messages, sysMsg] }));
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : "Failed to send reveal" });
    }
  },

  completeSession: async (postMortem: string) => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isLoading: true });
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, postMortem }),
      });
      const data: ScoreResponse = await res.json();
      set({ score: data, status: "completed", isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : "Failed to submit score" });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
