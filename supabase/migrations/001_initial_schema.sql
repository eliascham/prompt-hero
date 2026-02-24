-- Prompt Hero — Initial Database Schema

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

-- Indexes for common queries
create index idx_sessions_user on sessions(user_id);
create index idx_sessions_challenge on sessions(challenge_id);
create index idx_sessions_status on sessions(status);
create index idx_scores_user on scores(user_id);
create index idx_scores_challenge on scores(challenge_id);
create index idx_scores_total on scores(total_score desc);
