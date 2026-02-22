# Project Prompt Hero — AI-in-the-Middle Challenges

## Overview
Web-based challenge platform where the human sees the *true* problem requirements and must steer an AI coding session to a correct outcome. The AI works from a flawed brief that **neither the AI nor the user can directly read** — the user must discover what's wrong by observing the AI's behavior, then guide it via conversation.

## Core Mechanic
- **Two-plane spec**: Truth (authoritative) + AI Brief (flawed)
- **Human sees**: only the Truth spec + AI session transcript + repo state
- **AI sees**: only its flawed brief + repo + chat history
- **Neither side** sees the other's information — user must *infer* the AI's flawed beliefs from its behavior
- **Reveal budget**: 3 reveals per challenge (sentence-level from Truth panel)
- **Free-text only**: no structured action buttons — pure conversation is the only interaction mode
- **Character cap**: 280-500 chars per message
- **Scoring**: correctness 50%, intervention efficiency 30%, diagnosis quality 20%

## Gameplay Loop
1. **Observe** — Watch AI read code, write code, run tests. Notice when behavior diverges from Truth spec
2. **Diagnose** — Infer what the AI's flawed brief must say based on its behavior
3. **Intervene** — Use free-text chat or a Reveal to steer toward correct behavior

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

## Multi-Agent Architecture (5 agents via tmux)

### Agent Roles & File Ownership
| Agent | Role | Owns |
|-------|------|------|
| Architect | Scaffold & Infra | Project setup, `src/lib/db/`, `src/lib/redis.ts`, `src/lib/types.ts` |
| Facade | UI Shell & Two-Panel Layout | `src/components/`, `src/app/page.tsx`, `src/app/challenge/[id]/`, `src/stores/` |
| Phantom | Asymmetry Engine & API Routes | `src/engine/`, `src/app/api/` |
| Riddler | Challenges + E2B Sandbox | `src/challenges/`, `src/lib/sandbox.ts`, `src/lib/test-runner.ts` |
| Arbiter | Scoring, Leaderboard & Post-Mortem | `src/app/(auth)/`, `src/app/leaderboard/`, `src/app/profile/`, `src/lib/scoring.ts`, `src/lib/inngest/` |

### Dependency Order
1. **Architect** runs first — scaffolds project, installs deps, creates DB schema, defines shared types
2. After Architect pushes initial commit, **Facade**, **Phantom**, **Riddler**, **Arbiter** run in parallel
3. All agents commit to main (file ownership prevents conflicts)

## Project Structure
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/             # Arbiter
│   ├── challenge/[id]/     # Facade
│   ├── leaderboard/        # Arbiter
│   ├── profile/            # Arbiter
│   └── api/                # Phantom
├── components/             # Facade
├── stores/                 # Facade
├── lib/
│   ├── db/                 # Architect (Arbiter extends)
│   ├── redis.ts            # Architect
│   ├── types.ts            # Architect
│   ├── sandbox.ts          # Riddler
│   ├── test-runner.ts      # Riddler
│   ├── scoring.ts          # Arbiter
│   └── inngest/            # Arbiter
├── engine/                 # Phantom
│   ├── prompt-builder.ts
│   ├── reveal-handler.ts
│   ├── feedback-filter.ts
│   └── similarity.ts
└── challenges/             # Riddler
    ├── 01-invoice-parser/
    ├── 02-leaderboard-ranking/
    ├── 03-rate-limiter/
    ├── 04-config-migration/
    ├── 05-pii-redaction/
    ├── 06-event-deduplicator/
    ├── 07-notification-router/
    └── 08-log-aggregator/
```

## API Contracts (Facade <-> Phantom)

### POST /api/session
```typescript
// Request
{ challengeId: string }
// Response — NOTE: aiBrief is NOT sent to client
{
  sessionId: string;
  challenge: { id, title, tags, truthSpec: string, starterFiles: Record<string, string> };
  revealBudget: number; // 3
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

### POST /api/reveal
```typescript
// Request
{ sessionId: string; snippet: string }
// Response
{ revealsRemaining: number; injectedAs: string }
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
3. Reveals injected as "Updated requirement from stakeholder: ..."
4. Test feedback to AI: category + direction only, never raw output
5. Free-text messages checked for semantic similarity to Truth (cosine > 0.85 = blocked)
6. Truth panel: `user-select: none` + context menu disabled
7. AI system prompt uses "stakeholder clarification" framing — no meta-awareness
8. All user messages are free-text — no structured action buttons

## Anti-Cheese Enforcement
1. Non-selectable Truth panel (CSS `user-select: none`)
2. Semantic similarity detection (server-side, cosine threshold ~0.85)
3. Character cap per message (280-500 chars)
4. AI pushback on overly specific instructions (system prompt rule)

## Scoring Formula
- Correctness = (hidden tests passed / total) x 100
- Intervention efficiency = 100 - (reveals x 15) - (messages x 2)
- Diagnosis quality = post-mortem accuracy x 100
- Total = weighted average (correctness 50%, efficiency 30%, diagnosis 20%)
- S-rank = 100% correctness + 0 reveals + efficiency > 80

## 8 Challenges
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
  reveals_used int default 0,
  max_reveals int default 3,
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

## Notion Docs
- Main spec: https://www.notion.so/30ea063452eb80878b56d878b397963d
- Challenges: https://www.notion.so/84140c069ce34e078f2612ad461cde9e
- Multi-Agent Plan: https://www.notion.so/1f7b641d10444df78f2009ec142fa9c1
- Tech Stack: https://www.notion.so/35f60c4e939548a180e0a88526642876
