-- 0038_sweep_ledger: measuring and finding as separate jobs, and EXCAVATE's memory (EX18b, SEAM:SWEEP_MEASURE, SEAM:LEDGER).
-- Safe on top of 0001-0037, idempotent, safe to run twice. Run it before deploying the worker; until it runs, the worker counts as before.
-- Then run 0039_research_backfill.sql once (it marks the rows already in the lake, with row locks only).
-- 1. signals.research: true for a row a search brought in (EXCAVATE's live reads and gathers, a RECON's gathers and counter
--    searches: momentum.provenance live_* or recon_*). The database sets it on every insert, whoever inserts (the worker in
--    service now, the new one, a run that has not finished), so no row is ever filed wrong. Public counts and DAILY's picks read
--    research = false only; every row stays findable and usable as evidence. Adding the column is instant (a constant default
--    rewrites nothing); the lock it needs is asked for for five seconds at most, so a long query ahead of it fails this run
--    (run it again) instead of stalling the lake behind it.
-- 2. match_signals returns each neighbour's research flag, so the drain can tell a search's copy from the sweep's: a sweep story
--    is never rejected as an echo of a search's row (the search's row becomes the sweep's), and momentum counts sweep neighbours.
-- 3. subject_weeks: one row per subject per week. What the board measured, what the arrival posted (its rank, claim, move,
--    question, voices), a tracked brand's counts, a cohort's counts, the week's read. Never deleted. Service role only.

set lock_timeout = '5s';

-- 1. the sweep and the research.
alter table public.signals add column if not exists research boolean not null default false;

create or replace function public.signals_research_mark() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.research := coalesce(new.momentum->>'provenance', '') ~ '^(live|recon)';
  return new;
end $$;
drop trigger if exists signals_research_mark on public.signals;
create trigger signals_research_mark before insert on public.signals
  for each row execute function public.signals_research_mark();

-- 2. the drain's neighbours carry their flag (same arguments, same rows, one more column).
drop function if exists public.match_signals(vector, int, text, int, timestamptz);
create function public.match_signals(
  p_query     vector(384),
  p_count     int default 12,
  p_territory text default null,
  p_min_tier  int default 4,
  p_since     timestamptz default null
)
returns table (
  id uuid, url text, title text, summary text, source_name text,
  source_tier smallint, territory text, status text,
  captured_at timestamptz, momentum jsonb, similarity float, research boolean
)
language sql stable
as $$
  select s.id, s.url, s.title, s.summary, s.source_name,
         s.source_tier, s.territory, s.status,
         s.captured_at, s.momentum,
         1 - (s.embedding <=> p_query) as similarity,
         s.research
  from public.signals s
  where s.embedding is not null
    and (p_territory is null or s.territory = p_territory)
    and s.source_tier <= p_min_tier
    and (p_since is null or s.captured_at >= p_since)
  order by s.embedding <=> p_query
  limit p_count;
$$;

-- 3. the ledger.
create table if not exists public.subject_weeks (
  id          bigint generated always as identity primary key,
  subject_key text not null,                 -- theme:<id> | track:<id> | cohort:<key> | field:week
  kind        text not null check (kind in ('theme', 'track', 'cohort', 'field')),
  week        date not null,                 -- the Monday (UTC) of the week the row speaks for
  title       text,
  board       jsonb,                         -- what the board measured that week, its place and state
  door        jsonb,                         -- what the arrival posted: rank, claim, move, question, voices
  track       jsonb,                         -- a tracked brand's counts
  cohort      jsonb,                         -- a cohort's counts
  first_at    timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (subject_key, week)
);
create index if not exists subject_weeks_kind_week_idx on public.subject_weeks (kind, week desc);
alter table public.subject_weeks enable row level security;

-- Check: four lines come back.
select 'research column ready' as status
where exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'signals' and column_name = 'research')
union all
select 'research marked on insert'
where exists (select 1 from pg_trigger where tgname = 'signals_research_mark' and tgrelid = 'public.signals'::regclass)
union all
select 'neighbours carry the flag'
where exists (select 1 from information_schema.routines r join information_schema.parameters p on p.specific_name = r.specific_name
              where r.routine_schema = 'public' and r.routine_name = 'match_signals' and p.parameter_name = 'research' and p.parameter_mode = 'OUT')
union all
select 'subject_weeks ready'
where exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'subject_weeks');
