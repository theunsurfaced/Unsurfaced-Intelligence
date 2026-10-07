-- 0039_research_backfill: the rows already in the lake, marked by how they came in (EX18b, SEAM:SWEEP_MEASURE).
-- Run once, after 0038. An UPDATE takes row locks only: reads, captures and the drain carry on while it runs (give it a minute).
-- It runs once: the column's comment records that it ran, so a second run changes nothing and never re-marks a row the sweep
-- has since found for itself. A story a search brought in first and the sweep found later cannot be told apart in the old rows;
-- it is marked research (a small undercount in the history before today, which EX19's exact counts note).
do $$
begin
  if coalesce(col_description('public.signals'::regclass,
       (select attnum from pg_attribute where attrelid = 'public.signals'::regclass and attname = 'research')), '') <> 'research: backfilled' then
    update public.signals set research = true
    where research = false and coalesce(momentum->>'provenance', '') ~ '^(live|recon)';
    comment on column public.signals.research is 'research: backfilled';
  end if;
end $$;

-- Check: two lines come back.
select 'research rows: ' || count(*)::text as status from public.signals where research
union all
select 'backfill recorded'
where coalesce(col_description('public.signals'::regclass,
        (select attnum from pg_attribute where attrelid = 'public.signals'::regclass and attname = 'research')), '') = 'research: backfilled';
