-- ==================================================================
-- 0026_house_reads.sql
-- SEAM:READ_ENGINE: the house read object and its numbers.
--   house_reads        one row per compiled read (weekly | monthly | record),
--                      versioned per window, with the structured read, the
--                      SQL stats it stands on, and its lifecycle.
--   house_read_stats() every number a read may quote, computed by the
--                      database from published DAILY. The model never
--                      writes a number; it quotes these.
-- Service-role only. Run once in the Supabase SQL editor. Idempotent.
-- ==================================================================

create table if not exists public.house_reads (
  id           bigint generated always as identity primary key,
  kind         text not null check (kind in ('weekly','monthly','record')),
  window_start date not null,
  window_end   date not null,
  version      int  not null default 1,
  label        text not null,
  status       text not null default 'queued'
               check (status in ('queued','compiling','ready','held','failed','published')),
  stats        jsonb not null default '{}'::jsonb,
  read         jsonb,
  pack_ids     bigint[] not null default '{}',
  job_id       bigint,
  violations   jsonb not null default '[]'::jsonb,
  error        text,
  cost_usd     numeric(12,6),
  meta         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (window_end >= window_start)
);
create unique index if not exists house_reads_window_uq
  on public.house_reads (kind, window_start, window_end, version);
create index if not exists house_reads_status_idx
  on public.house_reads (status, kind, window_start);

alter table public.house_reads enable row level security;
revoke all on public.house_reads from anon, authenticated;

-- ── the numbers ────────────────────────────────────────────────────────
create or replace function public.house_read_stats(p_start date, p_end date)
returns jsonb
language sql stable
as $$
with eds as (
  select id, issue_no, date from public.editions
  where status = 'published' and date between p_start and p_end
),
items as (
  select ei.id, ei.edition_id, ei.headline, ei.territory, ei.format,
         ei.source_name, ei.signal_id, e.date, e.issue_no
  from public.edition_items ei join eds e on e.id = ei.edition_id
),
sig as (
  select i.id as item_id, i.date, i.headline, s.cluster_id, s.source_tier
  from items i join public.signals s on s.id = i.signal_id
),
threads as (
  select cluster_id,
         count(distinct date)  as days,
         count(*)              as stories,
         min(date)             as first_date,
         max(date)             as last_date,
         (array_agg(item_id order by date))[1:6] as item_ids
  from sig where cluster_id is not null
  group by cluster_id
  having count(distinct date) >= 2
)
select jsonb_build_object(
  'window',   jsonb_build_object('start', p_start, 'end', p_end),
  'editions', (select count(*) from eds),
  'issues',   jsonb_build_object('first', (select min(issue_no) from eds), 'last', (select max(issue_no) from eds)),
  'stories',  (select count(*) from items),
  'by_territory', coalesce((select jsonb_object_agg(t, n) from (
      select coalesce(territory, 'unassigned') t, count(*) n from items group by 1) x), '{}'::jsonb),
  'by_format', coalesce((select jsonb_object_agg(f, n) from (
      select coalesce(format, 'dispatch') f, count(*) n from items group by 1) x), '{}'::jsonb),
  'top_sources', coalesce((select jsonb_agg(jsonb_build_object('source', s, 'stories', n) order by n desc, s) from (
      select source_name s, count(*) n from items where source_name is not null
      group by 1 order by 2 desc, 1 limit 12) x), '[]'::jsonb),
  'sources_distinct', (select count(distinct source_name) from items where source_name is not null),
  'by_tier', coalesce((select jsonb_object_agg(t, n) from (
      select 'tier_' || source_tier t, count(*) n from sig group by 1) x), '{}'::jsonb),
  'threads', coalesce((select jsonb_agg(jsonb_build_object(
      'days', days, 'stories', stories, 'first', first_date, 'last', last_date, 'item_ids', item_ids)
      order by days desc, stories desc) from (select * from threads order by days desc, stories desc limit 15) x), '[]'::jsonb),
  'threads_total', (select count(*) from threads),
  'lake_captured', (select count(*) from public.signals
      where captured_at >= p_start and captured_at < p_end + 1),
  'calls_made', coalesce((select jsonb_object_agg(state, n) from (
      select state, count(*) n from public.cluster_calls
      where called_at >= p_start and called_at < p_end + 1 group by 1) x), '{}'::jsonb),
  'calls_resolved', coalesce((select jsonb_object_agg(outcome, n) from (
      select outcome, count(*) n from public.cluster_calls
      where resolved_at >= p_start and resolved_at < p_end + 1 and outcome is not null group by 1) x), '{}'::jsonb)
);
$$;

revoke all on function public.house_read_stats(date, date) from anon, authenticated;
