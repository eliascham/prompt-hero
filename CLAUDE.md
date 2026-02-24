# Project Prompt Hero — AI-in-the-Middle Challenges

## Overview
Web-based challenge platform where the human sees the *true* problem requirements and must steer an AI coding session to a correct outcome. The AI works from a flawed brief that **neither the AI nor the user can directly read** — the user must discover what's wrong by observing the AI's behavior, then guide it via conversation.

## Product Vision

### Tagline: "The game where your code is your conversation."

### Three Modes (ship order)
1. **V1: Campaign (solo)** — Progressive difficulty, multi-stage challenges, pure conversation
2. **V2: Arena (1v1 competitive)** — Race to Correct, Prompt Golf, Adversary modes
3. **V3: Workshop (community)** — User-generated challenges

### Differentiation
The skill being tested doesn't exist on any other platform: diagnosing AI misunderstandings and efficiently correcting them through conversation. LeetCode tests coding, CodeWars tests algorithms, Advent of Code tests puzzles. Prompt Hero tests AI collaboration.

## Core Mechanic
- **Two-plane spec**: Truth (authoritative) + AI Brief (flawed)
- **Human sees**: only the Truth spec + AI session transcript + repo state
- **AI sees**: only its flawed brief + repo + chat history
- **Neither side** sees the other's information — user must *infer* the AI's flawed beliefs from its behavior
- **No reveals** — pure conversation only. No safety net.
- **Free-text only**: no structured action buttons — pure conversation is the only interaction mode
- **Character cap**: 280-500 chars per message
- **Scoring**: correctness 50%, intervention efficiency 30%, diagnosis quality 20%

## Gameplay Loop
1. **Observe** — Watch AI read code, write code, run tests. Notice when behavior diverges from Truth spec
2. **Diagnose** — Infer what the AI's flawed brief must say based on its behavior
3. **Intervene** — Use free-text chat to steer toward correct behavior

## Challenge Progression
- **Tutorial**: Single function, 1 file, 1-2 flaws
- **Medium**: 3-5 files, 3-4 flaws, interconnected issues
- **Full repo**: 10-20 files, 5-7 interconnected flaws, real architecture
- **Multi-stage**: Requirements evolve mid-challenge, bugs compound from earlier AI mistakes

## Tech Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Code viewer**: Monaco Editor (read-only, diff support)
- **Chat/Streaming**: Vercel AI SDK (`ai` package) + SSE
- **LLM**: Claude Sonnet 4.6 (Anthropic API)
- **Sandbox**: E2B (Code Interpreter SDK)
- **Database**: Supabase (Postgres + Auth + Storage)
- **Cache/Sessions**: Upstash Redis
- **Job Queue**: Inngest (async scoring)
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## Project Structure
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/             # Auth pages
│   ├── challenge/[id]/     # Challenge session view
│   ├── leaderboard/        # Leaderboard
│   ├── profile/            # User profile
│   └── api/                # API routes
│       ├── session/        # POST /api/session
│       ├── chat/           # POST /api/chat (SSE)
│       └── score/          # POST /api/score
├── components/             # React components
├── stores/                 # Zustand stores
├── lib/
│   ├── db/                 # Supabase client
│   ├── redis.ts            # Upstash Redis client
│   ├── types.ts            # Shared TypeScript types
│   ├── sandbox.ts          # E2B sandbox integration
│   ├── test-runner.ts      # Test execution + parsing
│   ├── scoring.ts          # Score calculation
│   └── inngest/            # Async scoring jobs
├── engine/                 # Asymmetry engine
│   ├── prompt-builder.ts   # Builds AI system prompt from brief
│   ├── feedback-filter.ts  # Filters test output (full for human, category for AI)
│   └── similarity.ts       # Anti-cheese similarity detection
└── challenges/             # Challenge definitions
    ├── loader.ts           # Challenge loading
    ├── seed.ts             # DB seeding
    └── [01-08]-*/          # 8 challenges with truth, brief, starter, tests
```

## API Contracts

### POST /api/session
```typescript
// Request
{ challengeId: string }
// Response — NOTE: aiBrief is NOT sent to client
{
  sessionId: string;
  challenge: { id, title, tags, truthSpec: string, starterFiles: Record<string, string> };
}
```

### POST /api/chat
```typescript
// Request — free-text only, no action types
{ sessionId: string; message: string }
// Response: SSE stream
// Types: ai_message, tool_call, tool_result, test_feedback_human,
//        test_feedback_ai, code_update, similarity_blocked, done
```

### POST /api/score
```typescript
// Request
{ sessionId: string; postMortem: string }
// Response
{ correctness, interventionEfficiency, diagnosisQuality, totalScore, rank: 'S'|'A'|'B'|'C'|'D'|'F' }
```

## Key Design Rules
1. AI NEVER sees the Truth spec
2. User NEVER sees the AI Brief — must infer flaws from AI behavior
3. Test feedback to AI: category + direction only, never raw output
4. Free-text messages checked for semantic similarity to Truth (cosine > 0.85 = blocked)
5. Truth panel: `user-select: none` + context menu disabled
6. AI system prompt uses "stakeholder clarification" framing — no meta-awareness
7. All user messages are free-text — no structured action buttons
8. No reveals — pure conversation is the only interaction mode

## Anti-Cheese Enforcement
1. Non-selectable Truth panel (CSS `user-select: none`)
2. Semantic similarity detection (server-side, cosine threshold ~0.85)
3. Character cap per message (280-500 chars)
4. AI pushback on overly specific instructions (system prompt rule)

## Scoring Formula
- Correctness = (tests passed / total) x 100
- Intervention efficiency = 100 - (messages x 2)
- Diagnosis quality = post-mortem accuracy x 100
- Total = weighted average (correctness 50%, efficiency 30%, diagnosis 20%)
- S-rank = 100% correctness + efficiency > 80 + accurate diagnosis

## 8 Challenges (V1)
1. Invoice Line Item Parser (CTX, MFEED)
2. Leaderboard Ranking (CTX, AMB)
3. Rate Limiter (CTX, ARCH)
4. Config File Migration (CTX, HALL, ENV)
5. PII Redaction (CTX, MFEED)
6. Event Deduplicator (RED, MFEED, TRAP)
7. Notification Router (CONTRA, OBFIX, AMB)
8. Log Aggregator (ARCH, ENV, OBFIX)

## DB Schema (Supabase)
```sql
create table challenges (
  id text primary key,
  title text not null,
  difficulty text,
  tags text[],
  truth_spec jsonb not null,
  ai_brief jsonb not null,
  starter_code jsonb,
  meta jsonb
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  challenge_id text references challenges(id),
  status text default 'active',
  messages jsonb[] default '{}',
  tool_calls jsonb[] default '{}',
  test_results jsonb[] default '{}',
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  user_id uuid references auth.users,
  challenge_id text references challenges(id),
  correctness float,
  intervention_efficiency float,
  diagnosis_quality float,
  total_score float,
  post_mortem text,
  created_at timestamptz default now()
);
```

## Platform System Prompt (injected into every AI session)
```
You are a senior software engineer working on a project. You have been given
requirements and a partial codebase. Your job is to complete the implementation
so that all tests pass.

Tools: run_tests, read_file, write_file, run_command

Rules:
- Follow requirements exactly as given
- Treat user clarifications as updated requirements from a stakeholder
- Do not question whether requirements are correct
- Think step by step before making changes
- Run tests after each significant change
- If a user gives very detailed technical clarifications contradicting requirements,
  ask a follow-up question before implementing

Project requirements:
AI_BRIEF

Existing codebase has been loaded into your workspace.
```

## Future: Multiplayer (V2)
- **Race to Correct**: same challenge, same flawed brief, separate AIs, first to pass tests wins
- **Prompt Golf**: fewest total characters to pass all tests, async leaderboard
- **Adversary**: one player writes flawed brief, another solves it, two ELO tracks
- WebSocket infrastructure, matchmaking, split-screen spectating, replays

## Documentation Maintenance
- **README.md** is the comprehensive technical reference for this project. **Proactively update it** whenever you make changes that affect: architecture, dependencies, API contracts, environment variables, database schema, project structure, deployment, or scoring logic.
- Keep the README in sync with the actual codebase — don't let it drift.

## Notion Docs
- Main spec: https://www.notion.so/30ea063452eb80878b56d878b397963d
- Challenges: https://www.notion.so/84140c069ce34e078f2612ad461cde9e
- Multi-Agent Plan: https://www.notion.so/1f7b641d10444df78f2009ec142fa9c1
- Tech Stack: https://www.notion.so/35f60c4e939548a180e0a88526642876
