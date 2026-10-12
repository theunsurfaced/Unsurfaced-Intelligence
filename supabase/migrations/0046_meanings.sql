-- 0046_meanings.sql  --  EX42 THE PROBE: the meanings ledger. A reader's flip from the reading the engine led with to another: the
-- phrase as typed (lowercased), the reading taken (kind, entity, category), who, when. The probe reads it as a prior: a phrase flipped
-- to the same reading twice in 180 days leads with it next time. Service role only; never shown as a count.
set lock_timeout = '5s';
create table if not exists public.meanings (
  id bigint generated always as identity primary key,
  phrase text not null,
  kind text not null check (kind in ('literal','named','cultural','adjacent','situational')),
  entity text,
  category text,
  reader uuid,
  created_at timestamptz not null default now()
);
create index if not exists meanings_phrase_idx on public.meanings (phrase, created_at desc);
alter table public.meanings enable row level security;
revoke all on public.meanings from anon, authenticated;
select 'meanings ready' where exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'meanings');
