-- ==================================================================
-- 0062_scores.sql
-- SEAM:SCORECARD (EX54 THE SCORECARD): calibration as the engine's
-- feedback loop and its public headline, and the house's own score.
--   1. claims.calibrated   {from, to, held, n, category} on a finding the
--                          record moved one band lower before it was
--                          written; null otherwise. confidence is the band
--                          we said; calibrated.from is the band the engine
--                          earned, so a corrected band keeps learning.
--   2. claim_calibration   the graded claims (held or missed; unmeasured
--                          and ungraded are not calls), counted by the
--                          band we said: overall, by category, lens,
--                          entity, space (the door's frame_key) and month;
--                          and the category once more on the engine's band
--                          (category_engine), the adjustment's own count.
--   3. claim_calibration_examples
--                          the newest graded calls of each band, one a
--                          reading (its first finding in that band).
--   4. reading_scores      the house's own 1 to 5 on a reading: an
--                          overnight deployment (door), a live read
--                          (read) or a house read (house), one a reading
--                          and scorer, with an optional note.
-- Service role only. Run in the Supabase SQL editor after 0061.
-- Idempotent: every statement may run twice.
-- ==================================================================

alter table public.claims add column if not exists calibrated jsonb;
create index if not exists claims_graded_idx on public.claims (graded_at desc) where grade in ('held', 'missed');

create or replace function public.claim_calibration(p_on_record boolean default true)
returns table (dim text, key text, label text, band text, n int, held int)
language sql stable security definer set search_path = public as $$
  with g as (
    select c.id,
           case when c.confidence in ('High', 'Medium', 'Low') then c.confidence else 'Low' end as said,
           case when c.calibrated->>'from' in ('High', 'Medium', 'Low') then c.calibrated->>'from'
                when c.confidence in ('High', 'Medium', 'Low') then c.confidence else 'Low' end as eng,
           (c.grade = 'held') as ok,
           nullif(left(lower(btrim(regexp_replace(coalesce(c.frame->>'category', ''), '\s+', ' ', 'g'))), 60), '') as cat,
           nullif(c.lens, '') as lens,
           nullif(c.frame_key, '') as fk,
           to_char(c.night, 'YYYY-MM') as mon
    from public.claims c
    where c.grade in ('held', 'missed') and (not coalesce(p_on_record, true) or c.on_record)
  ), d as (
    select 'all'::text as dim, ''::text as key, null::text as label, g.said as band, g.ok from g
    union all select 'category', g.cat, null, g.said, g.ok from g where g.cat is not null
    union all select 'category_engine', g.cat, null, g.eng, g.ok from g where g.cat is not null
    union all select 'lens', g.lens, null, g.said, g.ok from g where g.lens is not null
    union all select 'space', g.fk, null, g.said, g.ok from g where g.fk is not null
    union all select 'month', g.mon, null, g.said, g.ok from g where g.mon is not null
    union all select 'entity', ce.entity_id::text, e.name, g.said, g.ok
      from g join public.claim_entities ce on ce.claim_id = g.id join public.entities e on e.id = ce.entity_id
  )
  select d.dim, d.key, max(d.label), d.band, count(*)::int, (count(*) filter (where d.ok))::int
  from d
  group by d.dim, d.key, d.band
  order by d.dim, d.key, d.band
$$;
revoke all on function public.claim_calibration(boolean) from public, anon, authenticated;
grant execute on function public.claim_calibration(boolean) to service_role;

create or replace function public.claim_calibration_examples(p_per int default 3, p_on_record boolean default true)
returns table (band text, night date, claim text, grade text, src text, reading_id text, graded_at timestamptz)
language sql stable security definer set search_path = public as $$
  select x.band, x.night, x.claim, x.grade, x.src, x.reading_id, x.graded_at
  from (
    select y.*, row_number() over (partition by y.band order by y.graded_at desc nulls last, y.night desc nulls last, y.reading_id collate "C" asc) as rn
    from (
      select distinct on (b.band, c.src, c.reading_id) b.band, c.night, c.claim, c.grade, c.src, c.reading_id, c.graded_at
      from public.claims c
      cross join lateral (select case when c.confidence in ('High', 'Medium', 'Low') then c.confidence else 'Low' end as band) b
      where c.grade in ('held', 'missed') and (not coalesce(p_on_record, true) or c.on_record)
      order by b.band, c.src, c.reading_id, c.idx asc
    ) y
  ) x
  where x.rn <= greatest(1, least(coalesce(p_per, 3), 10))
  order by x.band, x.rn
$$;
revoke all on function public.claim_calibration_examples(int, boolean) from public, anon, authenticated;
grant execute on function public.claim_calibration_examples(int, boolean) to service_role;

create table if not exists public.reading_scores (
  id          uuid primary key default gen_random_uuid(),
  src         text not null check (src in ('door', 'read', 'house')),   -- door_reads, reads (a live read) or house_reads
  reading_id  text not null,                                            -- the reading's id in that table
  score       int not null check (score between 1 and 5),
  note        text,
  by          text not null,                                            -- the scorer's user id
  at          timestamptz not null default now()
);
create unique index if not exists reading_scores_uq on public.reading_scores (src, reading_id, by);
create index if not exists reading_scores_at_idx on public.reading_scores (at desc);
alter table public.reading_scores enable row level security;
revoke all on public.reading_scores from anon, authenticated;
grant select, insert, update, delete on public.reading_scores to service_role;

-- what ran: four rows, each "... ready"
select 'claims.calibrated ready' as ready where exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'claims' and column_name = 'calibrated')
union all select 'claim_calibration ready' where exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname = 'claim_calibration')
union all select 'claim_calibration_examples ready' where exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname = 'claim_calibration_examples')
union all select 'reading_scores ready' where exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'reading_scores');
