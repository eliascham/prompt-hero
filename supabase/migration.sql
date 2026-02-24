-- Prompt Hero: Full database migration
-- Paste this into Supabase Dashboard → SQL Editor → New query → Run

-- 1. Challenges table
create table if not exists challenges (
  id text primary key,
  title text not null,
  difficulty text,
  tags text[],
  truth_spec jsonb not null,
  ai_brief jsonb not null,
  starter_code jsonb,
  meta jsonb
);

-- 2. Sessions table
create table if not exists sessions (
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

-- 3. Scores table
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  user_id text,
  challenge_id text references challenges(id),
  correctness float,
  intervention_efficiency float,
  diagnosis_quality float,
  total_score float,
  post_mortem text,
  created_at timestamptz default now()
);

-- 4. Indexes for common queries
create index if not exists idx_sessions_challenge on sessions(challenge_id);
create index if not exists idx_sessions_user on sessions(user_id);
create index if not exists idx_sessions_status on sessions(status);
create index if not exists idx_scores_session on scores(session_id);
create index if not exists idx_scores_user on scores(user_id);
create index if not exists idx_scores_challenge on scores(challenge_id);
create index if not exists idx_scores_total on scores(total_score desc);

-- 5. RLS policies (permissive for now — tighten for production)
alter table challenges enable row level security;
alter table sessions enable row level security;
alter table scores enable row level security;

-- Allow service role full access (our API routes use the secret key)
create policy "Service role full access on challenges"
  on challenges for all
  using (true) with check (true);

create policy "Service role full access on sessions"
  on sessions for all
  using (true) with check (true);

create policy "Service role full access on scores"
  on scores for all
  using (true) with check (true);
