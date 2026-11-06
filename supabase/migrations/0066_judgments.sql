-- ==================================================================
-- 0066_judgments.sql
-- SEAM:THE_GRADE (IQ3 THE GRADE): the judge's scores.
--   reading_judgments   one row a judged reading: the eight criteria
--                       (scores jsonb: {earned: {score, why}, ...}),
--                       the weighted total 0 to 100 counted by the
--                       worker, the level and the night of the reading,
--                       whether the house had marked it before the
--                       judge saw it (the judge never knows), the batch
--                       and its cost. A failed answer is a row too
--                       (status failed, error), so the week knows.
-- Service role only. Run in the Supabase SQL editor after 0065.
-- Idempotent: every statement may run twice.
-- ==================================================================

create table if not exists public.reading_judgments (
  id          uuid primary key default gen_random_uuid(),
  src         text not null default 'door' check (src in ('door', 'read', 'house')),
  reading_id  text not null,
  voice       text,
  level       text,
  night       date,
  subject     text,
  marked      boolean not null default false,
  status      text not null default 'done' check (status in ('done', 'failed')),
  error       text,
  scores      jsonb,
  total       int check (total between 0 and 100),
  batch_id    text,
  cost_usd    numeric not null default 0,
  at          timestamptz not null default now()
);
create index if not exists reading_judgments_reading_idx on public.reading_judgments (src, reading_id, at desc);
create index if not exists reading_judgments_at_idx on public.reading_judgments (at desc);
alter table public.reading_judgments enable row level security;
revoke all on public.reading_judgments from anon, authenticated;
grant select, insert, update, delete on public.reading_judgments to service_role;

select 'reading_judgments ready' as ready where exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'reading_judgments');
