-- ==================================================================
-- 0034_report.sql  (EX7 · THE REPORT)
-- The research-grade read. Two things only the database can hold:
--   1. house_reads.kind gains 'report': the Cultural Intelligence Report,
--      compiled over an explicit window on the whole lake, not only the
--      published DAILY stories (SEAM:READ_REPORT).
--   2. house_report_stats(p_start, p_end): every number the report may
--      quote, computed here. The window against the same length of days
--      before it; the lake by territory, by week, by tier and by outlet;
--      the themes with their weekly series; the tracked entities; the
--      frames and reads the house made; momentum per territory, decided
--      by the count and never by the writer. house_read_stats rides inside
--      as "daily", so every number the weekly may quote the report may too.
-- Service-role only. Run once in the Supabase SQL editor. Idempotent.
-- ==================================================================

-- 1. the kind
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.house_reads'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%kind%'
  loop
    execute format('alter table public.house_reads drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.house_reads
  add constraint house_reads_kind_check
  check (kind in ('weekly', 'monthly', 'record', 'report'));

-- 2. the numbers
create or replace function public.house_report_stats(p_start date, p_end date)
returns jsonb
language sql stable
as $$
with win as (
  select p_start::timestamptz as s, (p_end + 1)::timestamptz as e,
         (p_end - p_start + 1) as days,
         (p_start - (p_end - p_start + 1))::timestamptz as ps, p_start::timestamptz as pe
),
sig as (
  select s.id, s.title, s.source_name, s.source_tier, s.territory, s.theme_id, s.edition_item_id,
         coalesce(s.published_at, s.captured_at) as at
  from public.signals s
  where s.status <> 'rejected' and coalesce(s.published_at, s.captured_at) >= '2001-01-01'
),
cur as (select sig.* from sig, win where sig.at >= win.s and sig.at < win.e),
pri as (select sig.* from sig, win where sig.at >= win.ps and sig.at < win.pe),
weeks as (
  select generate_series(date_trunc('week', p_start::timestamp), date_trunc('week', p_end::timestamp), interval '1 week')::date as wk
),
by_week as (
  select w.wk, count(c.id) as n
  from weeks w left join cur c on date_trunc('week', c.at::timestamp)::date = w.wk
  group by w.wk
),
terr as (select coalesce(c.territory, 'unassigned') as t, count(*) as n from cur c group by 1),
terr_prior as (select coalesce(p.territory, 'unassigned') as t, count(*) as n from pri p group by 1),
terr_week as (
  select coalesce(c.territory, 'unassigned') as t, date_trunc('week', c.at::timestamp)::date as wk, count(*) as n
  from cur c group by 1, 2
),
themes_cur as (
  select c.theme_id, count(*) as n, min(c.at) as first_at, max(c.at) as last_at
  from cur c where c.theme_id is not null
  group by 1 order by n desc limit 16
),
theme_rows as (
  select tc.theme_id, tc.n, tc.first_at, tc.last_at,
    (select count(*) from pri p where p.theme_id = tc.theme_id) as n_prior,
    (select count(*) from sig x where x.theme_id = tc.theme_id) as n_total,
    (select x.title from cur x where x.theme_id = tc.theme_id and x.title is not null
       order by x.source_tier asc, x.at desc limit 1) as title,
    (select x.territory from cur x where x.theme_id = tc.theme_id and x.territory is not null
       group by x.territory order by count(*) desc limit 1) as territory,
    (select jsonb_agg(q.n order by q.wk) from (
       select w.wk, count(x.id) as n from weeks w
       left join cur x on x.theme_id = tc.theme_id and date_trunc('week', x.at::timestamp)::date = w.wk
       group by w.wk) q) as weeks
  from themes_cur tc
),
track_rows as (
  select t.id, t.name, t.sector,
    (select count(*) from cur c where c.title ilike '%' || t.name || '%') as n,
    (select count(*) from pri p where p.title ilike '%' || t.name || '%') as n_prior
  from public.tracks t where t.active
)
select jsonb_build_object(
  'daily', public.house_read_stats(p_start, p_end),
  'window', jsonb_build_object('start', p_start, 'end', p_end, 'days', (select days from win),
                               'prior_start', (select ps::date from win), 'prior_end', p_start - 1),
  'lake', jsonb_build_object(
    'signals', (select count(*) from cur),
    'signals_prior', (select count(*) from pri),
    'outlets', (select count(distinct source_name) from cur where source_name is not null),
    'outlets_prior', (select count(distinct source_name) from pri where source_name is not null),
    'published_to_daily', (select count(*) from cur where edition_item_id is not null),
    'by_territory', coalesce((select jsonb_object_agg(t, n) from terr), '{}'::jsonb),
    'by_territory_prior', coalesce((select jsonb_object_agg(t, n) from terr_prior), '{}'::jsonb),
    'by_tier', coalesce((select jsonb_object_agg('tier_' || source_tier, n) from (
        select source_tier, count(*) as n from cur group by 1) q), '{}'::jsonb),
    'by_week', coalesce((select jsonb_agg(jsonb_build_object('week', wk, 'n', n) order by wk) from by_week), '[]'::jsonb),
    'by_territory_week', coalesce((select jsonb_object_agg(tt.t, (
        select jsonb_agg(coalesce(tw.n, 0) order by w.wk) from weeks w
        left join terr_week tw on tw.t = tt.t and tw.wk = w.wk)) from terr tt where tt.t <> 'unassigned'), '{}'::jsonb),
    'top_outlets', coalesce((select jsonb_agg(jsonb_build_object('source', source_name, 'n', n) order by n desc) from (
        select source_name, count(*) as n from cur where source_name is not null
        group by 1 order by n desc limit 12) q), '[]'::jsonb),
    'record', (select count(*) from sig, win where sig.at < win.s and sig.source_tier <= 1)),
  'themes', coalesce((select jsonb_agg(jsonb_build_object('id', theme_id, 'title', title, 'territory', territory,
        'n', n, 'n_prior', n_prior, 'n_total', n_total, 'first', first_at::date, 'last', last_at::date, 'weeks', weeks)
        order by n desc) from theme_rows), '[]'::jsonb),
  'tracks', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'sector', sector, 'n', n, 'n_prior', n_prior)
        order by n desc, name) from track_rows), '[]'::jsonb),
  'frames', jsonb_build_object(
    'door_reads', (select count(*) from public.door_reads d where d.status in ('ready', 'reused') and d.night between p_start and p_end),
    'excavate_reads', (select count(*) from public.reads r where r.created_at >= p_start and r.created_at < p_end + 1)),
  'momentum', coalesce((select jsonb_object_agg(q.t, q.m) from (
      select tt.t,
        case when coalesce(tp.n, 0) = 0 and tt.n > 0 then 'new'
             when tt.n >= coalesce(tp.n, 0) * 1.15 then 'rising'
             when tt.n <= coalesce(tp.n, 0) * 0.85 then 'cooling'
             else 'holding' end as m
      from terr tt left join terr_prior tp on tp.t = tt.t where tt.t <> 'unassigned') q), '{}'::jsonb)
);
$$;

revoke all on function public.house_report_stats(date, date) from anon, authenticated;
