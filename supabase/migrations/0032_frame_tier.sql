-- ==================================================================
-- 0032_frame_tier.sql
-- SEAM:EXC_FRAME: the Claude ledger (claude_jobs) accepts the `frame`
-- tier, so the Haiku call that frames every EXCAVATE query is recorded
-- with its real cost like the doc, ingest and live tiers.
-- Service-role only. Run once in the Supabase SQL editor. Idempotent.
-- ==================================================================

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
  add constraint claude_jobs_tier_check check (tier in ('doc', 'ingest', 'live', 'frame'));

-- Check: one line comes back.
select 'frame tier ledgered' as status
where exists (select 1 from pg_constraint
              where conrelid = 'public.claude_jobs'::regclass
                and conname = 'claude_jobs_tier_check'
                and pg_get_constraintdef(oid) ilike '%frame%');
