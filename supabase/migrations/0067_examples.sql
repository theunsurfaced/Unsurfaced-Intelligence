-- ==================================================================
-- 0067_examples.sql
-- SEAM:THE_LOOP (IQ4 THE LOOP): the examples the writer learns from.
--   house_examples   one row a reading the house marked Sharp: its
--                    level, its subject, its night, the reading as
--                    the writer should see it (text), and its state:
--                    proposed by the mark, approved or retired by an
--                    admin in THE CORPUS room. Only approved examples
--                    reach a writer, the newest a level.
-- Service role only. Run in the Supabase SQL editor after 0066.
-- Idempotent: every statement may run twice.
-- ==================================================================

create table if not exists public.house_examples (
  id           uuid primary key default gen_random_uuid(),
  src          text not null default 'door' check (src in ('door', 'read', 'house')),
  reading_id   text not null,
  level        text check (level is null or level in ('industry', 'category', 'brand', 'talent')),
  subject      text,
  night        date,
  text         text not null,
  status       text not null default 'proposed' check (status in ('proposed', 'approved', 'retired')),
  proposed_by  text,
  approved_by  text,
  approved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists house_examples_uq on public.house_examples (src, reading_id);
create index if not exists house_examples_status_idx on public.house_examples (status, approved_at desc);
alter table public.house_examples enable row level security;
revoke all on public.house_examples from anon, authenticated;
grant select, insert, update, delete on public.house_examples to service_role;

select 'house_examples ready' as ready where exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'house_examples');
