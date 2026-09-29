-- ==================================================================
-- 0029_reference.sql  (EX3a · EXC_INTEL)
-- Nothing is ruled out. A live EXCAVATE search now places papers, books,
-- patents, filings, fact-checks and reference pages in the lake as status
-- `reference`: dated, tiered, embedded by the drain, findable through
-- match_signals_read (which excludes only `rejected`), and never composed
-- into DAILY (compose, the desk and the field read only filtered, connected
-- and published rows; theme_assign ignores reference rows too).
-- The Claude ledger (claude_jobs) accepts the new `live` tier, so every
-- EXCAVATE compile is recorded with its real cost like the doc and ingest tiers.
-- Safe on top of 0001-0028. Idempotent. Run before deploying the worker.
-- ==================================================================

-- Drop whatever check guards status (its name varies by how the table was made), then set the six states.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.signals'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.signals drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.signals
  add constraint signals_status_check
  check (status in ('raw', 'filtered', 'connected', 'published', 'rejected', 'reference'));

-- The ledger takes the live tier.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.claude_jobs'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%tier%'
  loop
    execute format('alter table public.claude_jobs drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.claude_jobs
  add constraint claude_jobs_tier_check check (tier in ('doc', 'ingest', 'live'));

-- Check: one line comes back.
select 'reference ready, live tier ledgered' as status
where exists (select 1 from pg_constraint
              where conrelid = 'public.signals'::regclass
                and conname = 'signals_status_check'
                and pg_get_constraintdef(oid) ilike '%reference%')
  and exists (select 1 from pg_constraint
              where conrelid = 'public.claude_jobs'::regclass
                and conname = 'claude_jobs_tier_check'
                and pg_get_constraintdef(oid) ilike '%live%');
