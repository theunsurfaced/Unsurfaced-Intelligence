-- ==================================================================
-- 0025_claude_jobs.sql
-- SEAM:CLAUDE_ROUTE: the durable ledger for the paid lane.
-- One row per Claude request, live or batch: tier, model, status,
-- usage, estimated and real cost. KV holds only the fast month
-- counter; this table is the memory that survives it.
-- Service-role only. Run once in the Supabase SQL editor. Idempotent.
-- ==================================================================

create table if not exists public.claude_jobs (
  id          bigint generated always as identity primary key,
  tier        text not null check (tier in ('doc','ingest')),
  kind        text not null,
  mode        text not null check (mode in ('live','batch')),
  model       text not null,
  batch_id    text,
  custom_id   text,
  status      text not null default 'submitted'
              check (status in ('submitted','done','failed')),
  result      text,
  error       text,
  stop_reason text,
  usage       jsonb,
  est_usd     numeric(12,6) not null default 0,
  cost_usd    numeric(12,6),
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  ended_at    timestamptz
);

create unique index if not exists claude_jobs_batch_custom_uq
  on public.claude_jobs (batch_id, custom_id) where batch_id is not null;
create index if not exists claude_jobs_status_idx
  on public.claude_jobs (status, created_at);
create index if not exists claude_jobs_tier_month_idx
  on public.claude_jobs (tier, created_at desc);

alter table public.claude_jobs enable row level security;
revoke all on public.claude_jobs from anon, authenticated;
-- service role bypasses RLS; the worker is the only door.
