-- 0018_field_state.sql
-- FIELD STATE arc: book anchors (relevance gate) + cluster calls (scoreboard).
-- Idempotent. Both tables are worker-only surfaces: the service role reads and
-- writes them through /excavate/propose and /excavate/anchors. RLS is enabled
-- with NO client policies — deny-by-default is the policy. No is_admin() or
-- is_approved() helper is referenced, so this migration cannot silently no-op
-- against a helper signature it guessed wrong.

-- ── book_anchors — the book of business, as vectors ─────────────────────────
-- One row per commercial territory Unsurfaced serves. owner NULL = house book;
-- a non-null owner keys a client lens (schema decided now so the client-lens
-- arc is a WHERE clause, not a migration fight).
create table if not exists public.book_anchors (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid,
  label      text not null,
  note       text,
  embedding  vector(384),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.book_anchors enable row level security;

create index if not exists book_anchors_active_idx
  on public.book_anchors (active) where active;

-- ── cluster_calls — every EMERGING/ACCELERATING read is a logged call ───────
-- unique(cluster_id, state) makes the mark idempotent: PROPOSE can upsert with
-- ignore-duplicates on every run and a cluster is only ever called once per
-- state. Resolution writes outcome + resolved_at ~30 days later.
create table if not exists public.cluster_calls (
  id          uuid primary key default gen_random_uuid(),
  cluster_id  uuid not null,
  state       text not null check (state in ('EMERGING','ACCELERATING')),
  called_at   timestamptz not null default now(),
  resolved_at timestamptz,
  outcome     text check (outcome in ('converted','held','faded')),
  unique (cluster_id, state)
);

alter table public.cluster_calls enable row level security;

create index if not exists cluster_calls_open_idx
  on public.cluster_calls (called_at) where resolved_at is null;
