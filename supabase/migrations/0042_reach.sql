-- ==================================================================
-- 0042_reach.sql
-- SEAM:CLIENT_PROFILE / SEAM:REACH_PUSH / SEAM:READER_MARKS (EX30 THE REACH)
-- A signed-in reader's profile: the role their implications are written for,
-- the brands they track, the frames they follow, where the push goes.
-- Reader marks on an insight (held, useful, wrong), one per reader.
-- The push log, so no insight is sent to the same reader twice.
-- Service-role only. Run once in the Supabase SQL editor. Idempotent.
-- ==================================================================

create table if not exists public.client_profile (
  user_id        uuid primary key,
  email          text,
  role_title     text not null default 'strategy',
  tracked_brands text[] not null default '{}',
  follows        jsonb not null default '[]'::jsonb,   -- [{kind:'brand'|'category'|'audience', value}]
  push_email     boolean not null default true,
  slack_webhook  text,
  teams_webhook  text,
  digest_day     smallint not null default 1,          -- 1 = Monday (UTC)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.client_profile enable row level security;
revoke all on public.client_profile from anon, authenticated;

create table if not exists public.insight_marks (
  id          bigint generated always as identity primary key,
  insight_id  uuid not null,
  user_id     uuid not null,
  mark        text not null check (mark in ('held', 'useful', 'wrong')),
  created_at  timestamptz not null default now(),
  unique (insight_id, user_id)
);
create index if not exists insight_marks_insight_idx on public.insight_marks (insight_id);
alter table public.insight_marks enable row level security;
revoke all on public.insight_marks from anon, authenticated;

create table if not exists public.push_log (
  id          bigint generated always as identity primary key,
  user_id     uuid not null,
  insight_id  uuid,
  kind        text not null,                           -- deployed | called | brief
  channel     text not null,                           -- email | slack | teams
  created_at  timestamptz not null default now()
);
create index if not exists push_log_user_idx on public.push_log (user_id, created_at desc);
alter table public.push_log enable row level security;
revoke all on public.push_log from anon, authenticated;
-- service role bypasses RLS; the worker is the only door.
