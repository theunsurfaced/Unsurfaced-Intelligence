-- 0040_memory: EXCAVATE remembers every week of every subject, exactly (EX20, SEAM:MEMORY).
-- Safe on top of 0001-0039, idempotent, safe to run twice. Run it before deploying the worker. Needs 0038 (signals.research and
-- subject_weeks).
-- 1. Headlines searchable by any part of a word (pg_trgm), so a tracked brand is counted in the database, exactly, in one call
--    instead of one capped scan per brand. Building the index takes a few seconds; captures wait for it, nothing is lost.
-- 2. The counting rule, once, in the database: a story counts in the week it was published, when our sweep found it within a
--    month of that date. A story dated after the day we found it, or found more than a month late, measures no week. Weeks are
--    Mondays, UTC (the worker's ledgerWeek).
-- 3. subject_weeks remembers three more things: the exact counts (counts, written by the counter), what our reads said about the
--    subject that week (said, keyed by read so a new version replaces the old), and how a call made that week graded (grade).
--    Territories join themes, tracked brands and audiences as subjects.
-- 4. memory_count_weeks: one kind of subject (theme, territory or track) for a run of weeks: stories, outlets and outlets over
--    the four weeks to date, the sweep only (research = false), never a rejected story. A recount replaces that run's counts. One
--    linear pass: each story counts in its own week and in the outlet window of the three weeks after it (a quiet week inside
--    that window gets its row too). A theme's row never takes a headline as its name; the board and the tiles name it.
-- 5. track_rollup: a tracked brand's last twelve weeks (rolling, ending now) with its outlets, its 7 and 30 days, its latest
--    story: what the brand cards and rooms show, exact.
-- 6. ledger_said_put: what a read said, merged into each subject's week (one read's entry replaces only that read's entry, and a
--    subject a new version no longer speaks to loses the old version's entry).
-- Every function is the service role's alone.

set lock_timeout = '5s';

-- 1. the headline index
create extension if not exists pg_trgm with schema extensions;
create index if not exists signals_title_trgm_idx on public.signals using gin (title extensions.gin_trgm_ops);

-- 2. the counting rule
create or replace function public.sweep_when(p_published timestamptz, p_captured timestamptz)
returns timestamptz
language sql immutable
set search_path = ''
as $$
  select case
    when p_captured is null then null
    when p_published is null then p_captured
    when p_published > p_captured + interval '24 hours' then null
    when p_published < p_captured - interval '720 hours' then null
    else p_published
  end
$$;

create or replace function public.sweep_week(p_published timestamptz, p_captured timestamptz)
returns date
language sql immutable
set search_path = ''
as $$
  select (date_trunc('week', public.sweep_when(p_published, p_captured) at time zone 'UTC'))::date
$$;

-- A tracked name as patterns, by the worker's rule (ilikeOr): pattern and filter characters go, a name needs three characters
-- with two letters or digits (H&M stays; LG and *** go).
create or replace function public.track_patterns(p_name text, p_aliases text[])
returns text[]
language sql immutable
set search_path = ''
as $$
  select coalesce(array_agg(distinct '%' || n || '%'), '{}'::text[])
  from (
    select btrim(regexp_replace(regexp_replace(x, '[%*_,()"\\]', ' ', 'g'), '\s+', ' ', 'g')) as n
    from unnest(array[p_name] || coalesce(p_aliases, '{}'::text[])) as u(x)
    where x is not null and length(x) >= 3
  ) q
  where length(replace(n, ' ', '')) >= 3 and length(regexp_replace(n, '[^[:alnum:]]', '', 'g')) >= 2
$$;

-- 3. subject_weeks remembers more
alter table public.subject_weeks add column if not exists counts jsonb;   -- the counter's: {n, outlets, outlets_4w, sweep}
alter table public.subject_weeks add column if not exists said jsonb;     -- the reads': {"<kind>:<window_start>": {read_id, version, label, items}}
alter table public.subject_weeks add column if not exists grade jsonb;    -- the grader's: {state, from, d30, d60, d90}
alter table public.subject_weeks drop constraint if exists subject_weeks_kind_check;
alter table public.subject_weeks add constraint subject_weeks_kind_check check (kind in ('theme', 'track', 'cohort', 'field', 'territory'));
create index if not exists subject_weeks_graded_idx on public.subject_weeks (week desc) where grade is not null;

-- 4. the counter
create or replace function public.memory_count_weeks(p_from date, p_to date, p_kind text, p_ids uuid[] default null)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_lo timestamptz := ((p_from - 22)::timestamp at time zone 'UTC');
  v_hi timestamptz := ((p_to + 38)::timestamp at time zone 'UTC');
  v_n  integer := 0;
begin
  if p_kind is null or p_kind not in ('theme', 'territory', 'track') or p_from is null or p_to is null or p_to < p_from or p_to - p_from > 63
     or extract(isodow from p_from) <> 1 or extract(isodow from p_to) <> 1 then
    raise exception 'memory_count_weeks: weeks are Mondays, at most ten weeks at a time, kind theme, territory or track';
  end if;

  -- a recount replaces the run's counts (a story rejected since stops counting)
  update public.subject_weeks w set counts = null, updated_at = now()
   where w.kind = p_kind and w.week between p_from and p_to and w.counts is not null
     and (p_ids is null or substr(w.subject_key, length(p_kind) + 2) = any (select x::text from unnest(p_ids) as x));

  with hits as (
    select 'theme:' || k.key::text as skey, 'theme'::text as kind, k.wk, k.source_name, k.title
      from (select coalesce(s.theme_id, s.cluster_id) as key, public.sweep_week(s.published_at, s.captured_at) as wk, s.source_name, s.title
              from public.signals s
             where p_kind = 'theme' and s.research = false and s.status <> 'rejected'
               and s.captured_at >= v_lo and s.captured_at < v_hi
               and coalesce(s.theme_id, s.cluster_id) is not null
               and (p_ids is null or coalesce(s.theme_id, s.cluster_id) = any (p_ids))) k
     where k.wk between p_from - 21 and p_to
       and (exists (select 1 from public.themes t where t.id = k.key and t.n >= 3)
            or exists (select 1 from public.subject_weeks w where w.subject_key = 'theme:' || k.key::text))
    union all
    select 'territory:' || s.territory, 'territory', public.sweep_week(s.published_at, s.captured_at), s.source_name, s.territory
      from public.signals s
     where p_kind = 'territory' and s.research = false and s.status <> 'rejected'
       and s.captured_at >= v_lo and s.captured_at < v_hi
       and s.territory is not null and s.territory <> 'unassigned'
       and public.sweep_week(s.published_at, s.captured_at) between p_from - 21 and p_to
    union all
    select 'track:' || h.track_id::text, 'track', h.wk, h.source_name, h.name
      from (select distinct on (t.id, s.id) t.id as track_id, t.name, public.sweep_week(s.published_at, s.captured_at) as wk, s.source_name
              from public.tracks t
              cross join lateral unnest(public.track_patterns(t.name, t.aliases)) as p(pat)
              join lateral (select s.id, s.published_at, s.captured_at, s.source_name
                              from public.signals s
                             where s.title ilike p.pat and s.research = false and s.status <> 'rejected'
                               and s.captured_at >= v_lo and s.captured_at < v_hi) s on true
             where p_kind = 'track' and t.active and (p_ids is null or t.id = any (p_ids))) h
     where h.wk between p_from - 21 and p_to
  ),
  spread as (   -- a story in its own week (d = 0) and in the four-week outlet window of each of the three weeks after it
    select h.skey, h.kind, h.wk + g.d as wk, g.d, h.source_name, h.title
      from hits h cross join (values (0), (7), (14), (21)) as g(d)
     where h.wk + g.d between p_from and p_to
  ),
  agg as (
    select skey, kind, wk,
           count(*) filter (where d = 0)::int as n,
           count(distinct source_name) filter (where d = 0)::int as outlets,
           count(distinct source_name)::int as outlets_4w,
           max(title) filter (where d = 0) as title
      from spread group by skey, kind, wk
  )
  insert into public.subject_weeks (subject_key, kind, week, title, counts, updated_at)
  select a.skey, a.kind, a.wk, case when a.kind = 'theme' then null else left(a.title, 160) end,
         jsonb_build_object('n', a.n, 'outlets', a.outlets, 'outlets_4w', a.outlets_4w, 'sweep', true), now()
    from agg a
  on conflict (subject_key, week) do update
    set counts = excluded.counts, title = coalesce(public.subject_weeks.title, excluded.title), updated_at = now();
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- the first week the sweep counted anything: before it, a week is not zero, it is unwatched
create or replace function public.memory_start()
returns date
language sql stable
set search_path = ''
as $$
  select public.sweep_week(null, min(s.captured_at)) from public.signals s where s.research = false
$$;

-- 5. a tracked brand's twelve rolling weeks, exact
create or replace function public.track_rollup(p_ids uuid[], p_now timestamptz default now())
returns table (track_id uuid, weeks integer[], outlets integer[], n7 integer, n30 integer, outlets30 integer, outlets84 integer, latest timestamptz, image text)
language sql stable
set search_path = ''
as $$
  with tp as (
    select t.id, p.pat from public.tracks t cross join lateral unnest(public.track_patterns(t.name, t.aliases)) as p(pat)
     where t.id = any (p_ids)
  ),
  hits as (
    select distinct on (tp.id, s.id) tp.id as track_id, public.sweep_when(s.published_at, s.captured_at) as w, s.source_name, s.image
      from tp join lateral (select s.id, s.published_at, s.captured_at, s.source_name, s.image
                              from public.signals s
                             where s.title ilike tp.pat and s.research = false and s.status <> 'rejected'
                               and s.captured_at >= p_now - interval '84 days' and s.captured_at <= p_now + interval '1 day') s on true
  ),
  ok as (
    select track_id, w, source_name, image, floor(extract(epoch from (p_now - w)) / 604800)::int as ago
      from hits where w is not null and w <= p_now and w > p_now - interval '84 days'
  ),
  wk as (select track_id, 11 - ago as i, count(*)::int as n, count(distinct source_name)::int as o from ok group by track_id, ago),
  tot as (
    select track_id,
           count(*) filter (where w > p_now - interval '7 days')::int as n7,
           count(*) filter (where w >= p_now - interval '30 days')::int as n30,
           count(distinct source_name) filter (where w >= p_now - interval '30 days')::int as o30,
           count(distinct source_name)::int as o84,
           max(w) filter (where w >= p_now - interval '30 days') as latest,
           (array_agg(image order by w desc) filter (where image ~ '^https://'))[1] as image
      from ok group by track_id
  ),
  b as (select x.id, g.i from unnest(p_ids) as x(id) cross join generate_series(0, 11) as g(i))
  select b.id, array_agg(coalesce(wk.n, 0) order by b.i), array_agg(coalesce(wk.o, 0) order by b.i),
         coalesce(max(tot.n7), 0), coalesce(max(tot.n30), 0), coalesce(max(tot.o30), 0), coalesce(max(tot.o84), 0), max(tot.latest), max(tot.image)
    from b left join wk on wk.track_id = b.id and wk.i = b.i
           left join tot on tot.track_id = b.id
   group by b.id
$$;

-- 6. what a read said, merged into each subject's week
drop function if exists public.ledger_said_put(jsonb);
create or replace function public.ledger_said_put(p_rows jsonb, p_entry text default null, p_week date default null)
returns integer
language plpgsql
set search_path = ''
as $$
declare v_n integer := 0;
begin
  if p_entry is not null and p_week is not null then   -- the subjects this version no longer speaks to lose the old entry
    update public.subject_weeks w set said = w.said - p_entry, updated_at = now()
     where w.week = p_week and w.said ? p_entry
       and w.subject_key <> all (select e.r->>'subject_key' from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) as e(r));
  end if;
  insert into public.subject_weeks (subject_key, kind, week, title, said, updated_at)
  select r->>'subject_key', r->>'kind', (r->>'week')::date, left(r->>'title', 160), r->'said', now()
    from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) as e(r)
   where r->>'kind' in ('theme', 'track', 'territory') and r->>'subject_key' ~ '^(theme|track|territory):'
     and r->>'week' ~ '^\d{4}-\d{2}-\d{2}$' and jsonb_typeof(r->'said') = 'object'
  on conflict (subject_key, week) do update
    set said = coalesce(public.subject_weeks.said, '{}'::jsonb) || excluded.said,
        title = coalesce(public.subject_weeks.title, excluded.title), updated_at = now();
  get diagnostics v_n = row_count;
  return v_n;
end $$;

revoke all on function public.sweep_when(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.sweep_week(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.track_patterns(text, text[]) from public, anon, authenticated;
revoke all on function public.memory_count_weeks(date, date, text, uuid[]) from public, anon, authenticated;
revoke all on function public.memory_start() from public, anon, authenticated;
revoke all on function public.track_rollup(uuid[], timestamptz) from public, anon, authenticated;
revoke all on function public.ledger_said_put(jsonb, text, date) from public, anon, authenticated;
grant execute on function public.sweep_when(timestamptz, timestamptz) to service_role;
grant execute on function public.sweep_week(timestamptz, timestamptz) to service_role;
grant execute on function public.track_patterns(text, text[]) to service_role;
grant execute on function public.memory_count_weeks(date, date, text, uuid[]) to service_role;
grant execute on function public.memory_start() to service_role;
grant execute on function public.track_rollup(uuid[], timestamptz) to service_role;
grant execute on function public.ledger_said_put(jsonb, text, date) to service_role;

-- Check: five lines come back.
select 'headline index ready' as status
where exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'signals' and indexname = 'signals_title_trgm_idx')
union all
select 'counting rule ready'
where public.sweep_week('2026-10-06 12:00+00', '2026-10-07 09:00+00') = date '2026-10-05'
  and public.sweep_week('2026-06-01 12:00+00', '2026-10-07 09:00+00') is null
  and public.track_patterns('H&M', array['LG', '***']) = array['%H&M%']
union all
select 'subject_weeks remembers counts, said and grades'
where (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'subject_weeks' and column_name in ('counts', 'said', 'grade')) = 3
union all
select 'counter ready'
where exists (select 1 from pg_proc where proname = 'memory_count_weeks') and exists (select 1 from pg_proc where proname = 'memory_start')
union all
select 'brands and reads ready'
where exists (select 1 from pg_proc where proname = 'track_rollup') and exists (select 1 from pg_proc where proname = 'ledger_said_put');
