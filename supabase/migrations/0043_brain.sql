-- ==================================================================
-- 0043_brain.sql
-- SEAM:CLIENT_EVIDENCE (EX32 THE BRAIN): what a reader brings. A deck's
-- text, a tracker, a report, pasted or uploaded, kept as titled chunks
-- under the reader's own id; a read on the reader's frames takes them in
-- as first-party lines. Service-role only. Idempotent.
-- ==================================================================

create table if not exists public.client_evidence (
  id          bigint generated always as identity primary key,
  user_id     uuid not null,
  title       text not null,
  kind        text not null default 'text',          -- text | csv | md | json
  bytes       integer not null default 0,
  chunks      jsonb not null default '[]'::jsonb,    -- [{n, text}]
  hint        text,                                   -- the frame words the reader says it is about (optional)
  created_at  timestamptz not null default now()
);
create index if not exists client_evidence_user_idx on public.client_evidence (user_id, created_at desc);
alter table public.client_evidence enable row level security;
revoke all on public.client_evidence from anon, authenticated;
-- service role bypasses RLS; the worker is the only door.
