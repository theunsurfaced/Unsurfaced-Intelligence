-- ==================================================================
-- 0041_folios.sql
-- SEAM:READ_FOLIO (EX23 COMPILE): a folio is a brief plus the ground
-- the editor chose: EXCAVATE reads, door frames, DAILY stories, house
-- reads (whole or one finding), and the editor's framing notes. A RECON
-- commissioned from a folio writes from that ground first.
-- An index on signals.momentum->>'read_id' lets a pinned live read
-- bring its own evidence lines (the lake keeps them by read id).
-- Service-role only. Run once in the Supabase SQL editor. Idempotent.
-- ==================================================================

create table if not exists public.folios (
  id          bigint generated always as identity primary key,
  title       text not null default 'Untitled folio',
  brief       text not null default '',
  scope       text not null default 'house',        -- 'house' now; 'client:<id>' when EX14b opens folios to clients
  items       jsonb not null default '[]'::jsonb,   -- [{k, ref, path, title, note, at, by}]
  status      text not null default 'open'
              check (status in ('open', 'commissioned', 'archived')),
  recon_ids   bigint[] not null default '{}',
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists folios_updated_idx on public.folios (updated_at desc);
alter table public.folios enable row level security;
revoke all on public.folios from anon, authenticated;
-- service role bypasses RLS; the worker is the only door.

create index if not exists signals_read_id_idx
  on public.signals ((momentum->>'read_id'))
  where momentum ? 'read_id';

-- Check: two lines come back.
select 'folios ready' as status where exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'folios')
union all
select 'signals read index ready' where exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'signals_read_id_idx');
