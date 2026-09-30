-- SEAM:WEEKLY_STAND
-- The stand v2: the issue's own cover fields, read off page one at publish time, never typed.
-- Idempotent. Safe to run twice. Runs after 0030_weekly_stand.sql.

alter table public.weekly_issues add column if not exists standfirst    text;
alter table public.weekly_issues add column if not exists stories_read  integer;
alter table public.weekly_issues add column if not exists editions      integer;
alter table public.weekly_issues add column if not exists sources       integer;
alter table public.weekly_issues add column if not exists threads       integer;
alter table public.weekly_issues add column if not exists issue_range   text;
alter table public.weekly_issues add column if not exists cover_credit  text;
alter table public.weekly_issues add column if not exists cover_key     text;

-- Real stats only: a stat is a positive count or absent.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'weekly_issues_stats_check') then
    alter table public.weekly_issues add constraint weekly_issues_stats_check check (
      (stories_read is null or stories_read >= 0) and (editions is null or editions >= 0) and
      (sources is null or sources >= 0) and (threads is null or threads >= 0));
  end if;
end
$$;
