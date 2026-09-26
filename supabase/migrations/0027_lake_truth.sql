-- ==================================================================
-- 0027_lake_truth.sql  (EX1b · LAKE_TRUTH)
-- 1. EXCAVATE reads the lake through match_signals_read: rejected rows
--    (echoes, bare announcements) are left out and the publish date comes
--    back, so reports and brand signal count what a row speaks for.
--    DAILY's own match_signals is NOT changed: its momentum counts echoes
--    as breadth on purpose, and its ranking must not move.
-- 2. The lake accepts tier 0, the house's own field studies (MINE), which
--    the old 1-4 check refused, so every MINE publish failed.
-- Safe on top of 0001-0026. Idempotent. Run it before deploying the worker.
-- ==================================================================

-- 2. tier 0 allowed: drop whatever check guards source_tier, then set 0-4.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.signals'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%source_tier%'
  loop
    execute format('alter table public.signals drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.signals
  add constraint signals_source_tier_check check (source_tier between 0 and 4);

-- 1. the report-facing lake search.
create or replace function public.match_signals_read(
  p_query     vector(384),
  p_count     int default 12,
  p_territory text default null,
  p_min_tier  int default 4,
  p_since     timestamptz default null
)
returns table (
  id uuid, url text, title text, summary text, source_name text,
  source_tier smallint, territory text, status text,
  published_at timestamptz, captured_at timestamptz, momentum jsonb, similarity float
)
language sql stable
as $$
  select s.id, s.url, s.title, s.summary, s.source_name,
         s.source_tier, s.territory, s.status,
         s.published_at, s.captured_at, s.momentum,
         1 - (s.embedding <=> p_query) as similarity
  from public.signals s
  where s.embedding is not null
    and s.status <> 'rejected'
    and (p_territory is null or s.territory = p_territory)
    and s.source_tier <= p_min_tier
    and (p_since is null or coalesce(s.published_at, s.captured_at) >= p_since)
  order by s.embedding <=> p_query
  limit p_count;
$$;

revoke all on function public.match_signals_read(vector, int, text, int, timestamptz) from public, anon, authenticated;
grant execute on function public.match_signals_read(vector, int, text, int, timestamptz) to service_role;

-- Check: both lines should come back.
select 'match_signals_read ready' as status
where exists (select 1 from pg_proc where proname = 'match_signals_read');
select pg_get_constraintdef(oid) as tier_rule from pg_constraint
where conrelid = 'public.signals'::regclass and conname = 'signals_source_tier_check';
