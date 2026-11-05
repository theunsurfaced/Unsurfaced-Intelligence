-- 0065_searches.sql  RD1e THE SEARCHES (SEAM:SEARCH_LEDGER): every question a reader asks the engine, who asked it, how it was
-- answered (compiled, served again from the day's read, or refused by the meter) and the read it returned, for READ's searches room.
-- The worker alone reads and writes it: row level security on and no grants. Idempotent.

create table if not exists public.searches (
  id        uuid primary key default gen_random_uuid(),
  at        timestamptz not null default now(),
  user_id   uuid,
  query     text not null,
  depth     text check (depth is null or depth in ('quick','full')),
  mode      text,
  status    text not null check (status in ('compiled','partial','cached','refused')),
  read_id   uuid references public.reads(id) on delete set null,
  cost_usd  numeric(10,4),
  meta      jsonb not null default '{}'::jsonb
);
create index if not exists searches_at_idx on public.searches (at desc);
create index if not exists searches_user_idx on public.searches (user_id, at desc);
create index if not exists searches_read_idx on public.searches (read_id);
alter table public.searches enable row level security;
revoke all on public.searches from anon, authenticated;

-- The reads before this cut, one row each, from the read ledger. Who asked is taken from the reader's own frame log (read_frame, logged
-- on every compiled read a signed-in reader framed since EX35e) when it names the same question within two minutes of the read; it is
-- never guessed otherwise and stays empty. A search served again from the day's read, or refused, was not recorded before this cut.
insert into public.searches (at, user_id, query, depth, mode, status, read_id, cost_usd, meta)
select r.created_at,
       coalesce(r.user_id, (
         select case when e.session_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then e.session_id::uuid end
         from public.activity_events e
         where e.platform = 'intelligence' and e.space = 'excavate' and e.event = 'read_frame'
           and e.meta->>'q' = left(r.query, 80)
           and e.created_at between r.created_at - interval '2 minutes' and r.created_at + interval '2 minutes'
         order by abs(extract(epoch from (e.created_at - r.created_at)))
         limit 1)),
       r.query, null, r.mode,
       case when (r.meta->>'partial') = 'true' then 'partial' else 'compiled' end,
       r.id,
       case when (r.meta->'model'->>'cost_usd') ~ '^[0-9]+(\.[0-9]+)?$' then (r.meta->'model'->>'cost_usd')::numeric end,
       jsonb_build_object('from', 'ledger')
from public.reads r
where not exists (select 1 from public.searches s where s.read_id = r.id);
