# Prompt Hero

An AI-in-the-middle challenge platform where you steer a flawed AI coding agent toward the correct solution using only conversation.

## The Game

You see the **true requirements**. The AI sees a **flawed brief**. Neither side sees the other's information. Your job: watch the AI code, diagnose what it's getting wrong, and guide it to the correct solution through free-text chat — without copy-pasting the answer.

**Observe** the AI read files, write code, and run tests. **Diagnose** what its flawed brief must say based on its behavior. **Intervene** with chat messages to steer the AI toward the correct solution.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui (New York) |
| State | Zustand 5 |
| Code Editor | Monaco Editor (read-only + diff) |
| LLM | Claude Sonnet 4 via Anthropic SDK |
| Sandbox | E2B Code Interpreter (isolated VMs) |
| Database | Supabase (Postgres + Auth) |
| Cache | Upstash Redis |
| Job Queue | Inngest (async scoring) |
| Streaming | SSE (Server-Sent Events) |

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- API keys (see [Environment Variables](#environment-variables))

### Install & Run

```bash
git clone <repo-url> && cd prompt-hero
npm install
cp .env.local.example .env.local   # Fill in your API keys
npm run dev                         # http://localhost:3000
```

### Seed the Database

After configuring Supabase and running the migration (`supabase/migration.sql`):

```bash
set -a && source .env.local && set +a && npx tsx src/challenges/seed.ts
```

### Docker

```bash
docker build -t prompt-hero .
docker run -p 3000:3000 --env-file .env.local prompt-hero
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (publishable) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role (secret) key |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis auth token |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `E2B_API_KEY` | No | E2B sandbox key (mock fallback without it) |
| `INNGEST_EVENT_KEY` | No | Inngest event key (async scoring) |
| `INNGEST_SIGNING_KEY` | No | Inngest signing key |

## Project Structure

```
src/
├── app/                            # Next.js App Router
│   ├── page.tsx                    # Home — challenge list
│   ├── challenge/[id]/page.tsx     # Main gameplay (3-column grid layout)
│   ├── leaderboard/page.tsx        # Score rankings
│   ├── profile/page.tsx            # User stats
│   ├── post-mortem/[sessionId]/    # Post-game diagnosis review
│   ├── (auth)/                     # Login & signup
│   └── api/
│       ├── chat/route.ts           # SSE streaming + agentic tool loop
│       ├── session/route.ts        # Create/load challenge sessions
│       ├── score/route.ts          # Compute final score
│       └── inngest/route.ts        # Async job endpoint
├── components/                     # React UI components
│   ├── TruthPanel.tsx              # Left column — truth spec (non-selectable, collapsible)
│   ├── ChatPanel.tsx               # Right column — chat message history + header
│   ├── ChatInput.tsx               # Free-text input (char-limited)
│   ├── CodeViewer.tsx              # Center column — Monaco editor (read-only + diff + line selection)
│   ├── PostMortemForm.tsx          # Post-mortem dialog form
│   ├── ToolCallCard.tsx            # AI tool invocation display
│   ├── ScoreDisplay.tsx            # Final score + S-F rank
│   └── ui/                         # shadcn/ui primitives
├── engine/                         # Asymmetry & AI orchestration
│   ├── prompt-builder.ts           # Build AI system prompt from flawed brief
│   ├── tool-executor.ts            # Execute tools (E2B sandbox or mock)
│   ├── feedback-filter.ts          # Strip test output to category + direction
│   └── similarity.ts               # Block messages too similar to truth
├── stores/                         # Zustand state management
│   ├── sessionStore.ts             # Session, messages, errors
│   └── codeStore.ts                # File contents for code viewer
├── lib/                            # Infrastructure & utilities
│   ├── db/index.ts                 # Supabase client
│   ├── redis.ts                    # Upstash Redis (session cache)
│   ├── sandbox.ts                  # E2B sandbox lifecycle
│   ├── test-runner.ts              # Execute & parse test results
│   ├── scoring.ts                  # Scoring formulas
│   ├── inngest/                    # Async job definitions
│   └── types.ts                    # Shared TypeScript interfaces
└── challenges/                     # 8 challenge definitions
    ├── loader.ts                   # Load from JSON files
    ├── seed.ts                     # Seed Supabase from files
    └── 01-invoice-parser/          # Each challenge has:
        ├── challenge.json          #   Metadata (title, difficulty, tags)
        ├── truth.md                #   Correct spec (user sees)
        ├── ai-brief.md             #   Flawed spec (AI sees)
        ├── meta.json               #   Hidden test config
        └── starter_code/           #   Initial files for sandbox
```

## API Routes

### `POST /api/session`
Create a new challenge session. Returns session ID, truth spec, and starter files. The AI brief is **never** sent to the client.

### `POST /api/chat`
Send a free-text message. Returns an SSE stream with events:
- `ai_message` — Claude's streamed text response
- `tool_call` / `tool_result` — AI tool invocations and results
- `test_feedback_human` / `test_feedback_ai` — Filtered test results
- `code_update` — File written by AI
- `similarity_blocked` — Message too close to truth spec
- `done` — Stream complete

The chat route implements an **agentic tool-use loop**: Claude can call tools (read/write files, run commands, run tests), receive results, and continue reasoning — up to 10 rounds per message.

### `POST /api/score`
Submit a post-mortem diagnosis. Returns weighted score breakdown and rank (S through F).

## Scoring

| Component | Weight | Formula |
|-----------|--------|---------|
| Correctness | 50% | (hidden tests passed / total) x 100 |
| Intervention Efficiency | 30% | 100 - (messages x 2) |
| Diagnosis Quality | 20% | Post-mortem accuracy vs known flaws |
| **S-Rank** | — | 100% correctness + efficiency > 80 + accurate diagnosis |

## Challenges

| # | Challenge | Difficulty | Flaw Types |
|---|-----------|-----------|------------|
| 01 | Invoice Line Item Parser | Easy | CTX, MFEED |
| 02 | Leaderboard Ranking | Easy | CTX, AMB |
| 03 | Rate Limiter | Medium | CTX, ARCH |
| 04 | Config File Migration | Medium | CTX, HALL, ENV |
| 05 | PII Redaction | Medium | CTX, MFEED |
| 06 | Event Deduplicator | Hard | RED, MFEED, TRAP |
| 07 | Notification Router | Hard | CONTRA, OBFIX, AMB |
| 08 | Log Aggregator | Hard | ARCH, ENV, OBFIX |

**Flaw type key**: CTX = missing context, MFEED = misleading feedback, AMB = ambiguity, ARCH = architectural, HALL = hallucinated requirement, ENV = environment assumption, RED = red herring, TRAP = trap logic, CONTRA = contradiction, OBFIX = obscured fix

## Anti-Cheat

- Truth panel is CSS non-selectable (`user-select: none`, context menu disabled)
- Messages checked server-side for cosine similarity to truth spec (> 0.85 = blocked)
- Character limit per message (max 500)
- AI system prompt pushes back on overly specific instructions

## Database Schema

Three tables in Supabase (Postgres):

- **`challenges`** — ID, title, difficulty, tags, truth_spec (JSONB), ai_brief (JSONB), starter_code, meta
- **`sessions`** — UUID, user_id, challenge_id, status, messages[], tool_calls[], test_results[]
- **`scores`** — session_id, correctness, intervention_efficiency, diagnosis_quality, total_score, post_mortem

Full migration: `supabase/migration.sql`

## Architecture Notes

### Challenge Page Layout

The challenge page uses a **CSS grid three-column layout** (VS Code-style):

```
┌──────────────┬────────────────────────┬───────────────────┐
│ TRUTH PANEL  │ CODE EDITOR            │ CHAT PANEL        │
│ (280px,      │ (flex, toolbar + Monaco)│ (340px, header +  │
│  collapsible)│                        │  messages + input) │
└──────────────┴────────────────────────┴───────────────────┘
```

- **Truth panel** collapses to `0px` with animated `grid-template-columns` transition
- **Code editor** (center) has a toolbar with collapse toggle, challenge title, and Submit button
- **Chat panel** (right) has a header with message count
- **Post-mortem** is a Dialog modal triggered by the Submit button (not a tab)
- Monaco uses a `ResizeObserver` to reflow when the truth panel collapses/expands

### Agentic Tool-Use Loop
The `/api/chat` route runs a multi-round loop. When Claude calls a tool (e.g., `write_file`), the server:
1. Executes the tool in the E2B sandbox (or mock)
2. Streams the result to the browser via SSE
3. Feeds the result back to Claude as a `tool_result` message
4. Claude continues reasoning with the result

This repeats up to 10 rounds per user message, enabling Claude to read files, write code, run tests, and iterate autonomously.

### E2B Sandbox
Each session gets an isolated Linux VM via E2B's API. The sandbox is seeded with the challenge's starter files and persists for the session duration (5-minute timeout). If `E2B_API_KEY` is not set, a mock executor returns plausible fake results.

### Information Asymmetry
The core game mechanic relies on strict separation:
- **Server** holds both truth spec and AI brief
- **Client** receives only truth spec (via `/api/session`)
- **Claude** receives only AI brief (via system prompt in `/api/chat`)
- The user must bridge the gap through pure conversation — no reveals or shortcuts

## Scripts

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

### Docker (recommended for SSE + sandbox state)

```bash
docker build -t prompt-hero .
docker run -p 3000:3000 --env-file .env.local prompt-hero
```

Suitable for Railway, Fly.io, or any container host. The Dockerfile uses a multi-stage Alpine build with Next.js standalone output.

### Vercel

Works for the web app, but note:
- Serverless function timeouts may affect long SSE streams
- In-memory sandbox state doesn't persist across invocations
- Consider using E2B's persistent sandbox IDs if deploying serverless

## Built With

This project was scaffolded using a 5-agent architecture (Architect, Facade, Phantom, Riddler, Arbiter) running in parallel via tmux, with file ownership preventing merge conflicts. See `CLAUDE.md` for the full specification.
