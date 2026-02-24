// ============================================================
// Shared types for Project Prompt Hero
// ============================================================

// ---------- Challenge ----------
export interface Challenge {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  truthSpec: TruthSpec;
  aiBrief: AiBrief;
  starterCode: Record<string, string>;
  meta: ChallengeMeta;
}

export interface TruthSpec {
  title: string;
  overview: string;
  requirements: TruthRequirement[];
  edgeCases: string[];
  testSummary: string;
}

export interface TruthRequirement {
  id: string;
  text: string;
}

export interface AiBrief {
  title: string;
  overview: string;
  requirements: string[];
  flaws: Flaw[];
}

export interface Flaw {
  id: string;
  type: FlawType;
  description: string;
  affectedRequirement: string;
}

export type FlawType =
  | "CTX"    // Context manipulation
  | "MFEED"  // Misleading feedback
  | "AMB"    // Ambiguous spec
  | "ARCH"   // Architecture mismatch
  | "HALL"   // Hallucinated feature
  | "ENV"    // Environment assumption
  | "RED"    // Red herring
  | "TRAP"   // Trap code
  | "CONTRA" // Contradiction
  | "OBFIX"  // Obvious fix misdirection;

export interface ChallengeMeta {
  estimatedMinutes: number;
  optimalMessages: number;
  flawTypes: FlawType[];
}

// ---------- Session ----------
export interface Session {
  id: string;
  userId: string | null;
  challengeId: string;
  status: SessionStatus;
  messages: ChatMessage[];
  toolCalls: ToolCallRecord[];
  testResults: TestResult[];
  createdAt: string;
  completedAt: string | null;
}

export type SessionStatus = "active" | "completed" | "abandoned";

// ---------- Chat ----------
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface ToolCallRecord {
  id: string;
  name: "run_tests" | "read_file" | "write_file" | "run_command";
  input: Record<string, unknown>;
  output: string;
  timestamp: string;
}

// ---------- SSE Events ----------
export type SSEEventType =
  | "ai_message"
  | "tool_call"
  | "tool_result"
  | "test_feedback_human"
  | "test_feedback_ai"
  | "code_update"
  | "similarity_blocked"
  | "done";

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
}

// ---------- Tests ----------
export interface TestResult {
  passed: boolean;
  testName: string;
  category: string;
  direction?: string; // shown to AI (category + direction only)
  rawOutput?: string; // never shown to AI
  timestamp: string;
}

export interface TestFeedbackHuman {
  testName: string;
  passed: boolean;
  rawOutput: string;
}

export interface TestFeedbackAI {
  category: string;
  direction: string; // e.g. "output format incorrect" — no raw data
}

// ---------- Scoring ----------
export interface Score {
  id: string;
  sessionId: string;
  userId: string;
  challengeId: string;
  correctness: number;
  interventionEfficiency: number;
  diagnosisQuality: number;
  totalScore: number;
  postMortem: string;
  rank: ScoreRank;
  createdAt: string;
}

export type ScoreRank = "S" | "A" | "B" | "C" | "D" | "F";

// ---------- API Contracts ----------

// POST /api/session
export interface CreateSessionRequest {
  challengeId: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  challenge: {
    id: string;
    title: string;
    tags: string[];
    truthSpec: TruthSpec;
    starterFiles: Record<string, string>;
  };
}

// POST /api/chat
export interface ChatRequest {
  sessionId: string;
  message: string;
}
// Response: SSE stream

// POST /api/score
export interface ScoreRequest {
  sessionId: string;
  postMortem: string;
}

export interface ScoreResponse {
  correctness: number;
  interventionEfficiency: number;
  diagnosisQuality: number;
  totalScore: number;
  rank: ScoreRank;
}
