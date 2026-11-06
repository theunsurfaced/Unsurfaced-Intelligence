-- ==================================================================
-- 0068_for_you.sql
-- SEAM:FOR_YOU (IQ5 FOR YOU): the reading for a group.
--   for_you   one row a reading and a group: the group's key (a role and
--             an industry, or a company), the layer the writer wrote
--             (text: {takeaway, read, move}), the writer's voice it was
--             written under, its cost, who asked. Written once a group
--             and reused by everyone in it; a new voice writes it again.
-- Service role only. Run in the Supabase SQL editor after 0067.
-- Idempotent: every statement may run twice.
-- ==================================================================

create table if not exists public.for_you (
  id          uuid primary key default gen_random_uuid(),
  src         text not null default 'door' check (src in ('door', 'read')),
  reading_id  text not null,
  group_key   text not null,
  role        text,
  industry    text,
  company     text,
  text        jsonb not null,
  voice       text,
  cost_usd    numeric not null default 0,
  by          text,
  created_at  timestamptz not null default now()
);
create unique index if not exists for_you_uq on public.for_you (src, reading_id, group_key);
create index if not exists for_you_reading_idx on public.for_you (src, reading_id);
alter table public.for_you enable row level security;
revoke all on public.for_you from anon, authenticated;
grant select, insert, update, delete on public.for_you to service_role;

select 'for_you ready' as ready where exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'for_you');
