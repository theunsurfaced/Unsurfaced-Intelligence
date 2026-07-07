-- ==================================================================
-- 0007_activity_events.sql
-- SEAM:ACTIVITY_LOG storage: raw events + daily rollup for OPS.
-- No PII in meta — enforced by convention at the Worker seam; payment
-- data categorically excluded (Part 5.2). Safe on top of 0001-0006.
-- Idempotent.
-- ==================================================================

create table if not exists public.activity_events (
  id          bigint generated always as identity primary key,
  platform    text not null check (platform in ('intelligence','daily','arcade','home')),
  space       text,                       -- play | excavate | mine | rps | claw | pop | ops | null
  event       text not null,              -- e.g. dig_run, asset_created, score_submitted, edition_read
  session_id  text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists activity_events_time_idx
  on public.activity_events (created_at desc);
create index if not exists activity_events_slice_idx
  on public.activity_events (platform, space, event, created_at desc);

-- Daily aggregates: what OPS charts actually read.
create table if not exists public.activity_daily (
  day       date not null,
  platform  text not null,
  space     text not null default '',
  event     text not null,
  count     bigint not null default 0,
  primary key (day, platform, space, event)
);

-- Locked: Worker-only writes, admin-verified Worker-mediated reads.
alter table public.activity_events enable row level security;
alter table public.activity_daily  enable row level security;
revoke all on public.activity_events from anon, authenticated;
revoke all on public.activity_daily  from anon, authenticated;

-- Nightly rollup (Worker cron 04:30 UTC calls this via RPC, then the
-- prune). Rolls everything before today into activity_daily.
create or replace function public.activity_rollup()
returns void language sql
as $$
  insert into public.activity_daily (day, platform, space, event, count)
  select created_at::date, platform, coalesce(space,''), event, count(*)
  from public.activity_events
  where created_at::date < current_date
  group by 1, 2, 3, 4
  on conflict (day, platform, space, event)
  do update set count = excluded.count;
$$;

-- Free-tier discipline: prune raw events older than 90 days
-- (aggregates persist forever; raw detail has a shelf life).
create or replace function public.activity_prune()
returns bigint language plpgsql
as $$
declare n bigint;
begin
  delete from public.activity_events
  where created_at < now() - interval '90 days';
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.activity_rollup() from anon, authenticated;
revoke all on function public.activity_prune()  from anon, authenticated;
