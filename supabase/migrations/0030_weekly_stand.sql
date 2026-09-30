-- SEAM:WEEKLY_STAND
-- The Weekly Read stand: issues on the shelf, readers in the database, one claim row per download.
-- Idempotent. Safe to run twice, and safe on a database that already carries an earlier cut of this file.
-- The worker reads and writes with the service role only.

create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- One row per published issue. r2_key names the PDF in R2. Real page_count and byte_size only.
create table if not exists public.weekly_issues (
  issue_no      integer primary key,
  week_start    date not null,
  week_end      date not null,
  lead          text not null,
  page_count    integer,
  byte_size     bigint,
  r2_key        text not null,
  status        text not null default 'draft' check (status in ('draft','published')),
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists weekly_issues_pub_idx on public.weekly_issues (status, issue_no desc);

-- One row per person. email is the identity; a returning reader updates this row, never duplicates it.
-- user_id is set once the person has signed in with a platform account; from then on the anonymous
-- form can add claims to the row but cannot rewrite its name or company.
create table if not exists public.weekly_readers (
  id            uuid primary key default gen_random_uuid(),
  email         citext not null unique,
  user_id       uuid,
  first_name    text not null default '',
  last_name     text not null default '',
  company       text,
  role          text,
  frame_group   text,
  opt_in        boolean not null default false,
  claim_count   integer not null default 0,
  first_seen    timestamptz not null default now(),
  last_seen     timestamptz not null default now()
);

-- One row per download. This is the intake ledger. via says which door the reader used.
create table if not exists public.weekly_claims (
  id            uuid primary key default gen_random_uuid(),
  reader_id     uuid not null references public.weekly_readers(id) on delete cascade,
  issue_no      integer not null references public.weekly_issues(issue_no),
  via           text not null default 'form' check (via in ('form','signin')),
  user_id       uuid,
  ua            text,
  ip_hash       text,
  referer       text,
  created_at    timestamptz not null default now()
);

-- Columns added after an earlier cut of this file. No-ops on a fresh apply. These run before any
-- index or constraint that names them.
alter table public.weekly_readers add column if not exists user_id uuid;
alter table public.weekly_claims  add column if not exists via text not null default 'form';
alter table public.weekly_claims  add column if not exists user_id uuid;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'weekly_claims_via_check') then
    alter table public.weekly_claims add constraint weekly_claims_via_check check (via in ('form','signin'));
  end if;
end
$$;

create index if not exists weekly_claims_reader_idx on public.weekly_claims (reader_id, created_at desc);
create index if not exists weekly_claims_issue_idx  on public.weekly_claims (issue_no, created_at desc);
create index if not exists weekly_readers_user_idx  on public.weekly_readers (user_id) where user_id is not null;

alter table public.weekly_issues  enable row level security;
alter table public.weekly_readers enable row level security;
alter table public.weekly_claims  enable row level security;
-- No anon or authenticated policies on purpose. Only the service role (the worker) touches these tables.

-- The cover price, atomically: upsert the reader, insert the claim, bump the count.
--   p_via      'form' (the intake) or 'signin' (an account holder who signed in for this download)
--   p_user_id  the auth user id on the signin path, null on the form path
-- Rules the upsert enforces:
--   a row that carries user_id is rewritten only by the signin path; the form may add claims to it, nothing else
--   opt_in only ever turns on here (turning off is a mailing concern, handled where mail is sent)
--   blank values never overwrite stored ones
-- Refuses an unpublished issue with PT404 so PostgREST answers 404. Returns jsonb.
drop function if exists public.weekly_claim(text, text, text, text, text, text, boolean, integer, text, text, text);
create or replace function public.weekly_claim(
  p_email       text,
  p_first       text,
  p_last        text,
  p_company     text,
  p_role        text,
  p_frame_group text,
  p_opt_in      boolean,
  p_issue_no    integer,
  p_ua          text,
  p_ip_hash     text,
  p_referer     text,
  p_user_id     uuid default null,
  p_via         text default 'form'
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id        uuid;
  v_inserted  boolean;
  v_count     integer;
  v_claim     uuid;
  v_form      boolean := (p_via = 'form');
begin
  if p_via not in ('form', 'signin') then
    raise exception 'via % is not a claim path', p_via using errcode = 'PT422';
  end if;
  if not exists (select 1 from weekly_issues wi where wi.issue_no = p_issue_no and wi.status = 'published') then
    raise exception 'issue % is not published', p_issue_no using errcode = 'PT404';
  end if;

  insert into weekly_readers as wr
    (email, user_id, first_name, last_name, company, role, frame_group, opt_in, claim_count)
  values
    (p_email::citext, p_user_id, coalesce(p_first, ''), coalesce(p_last, ''), nullif(p_company, ''),
     nullif(p_role, ''), nullif(p_frame_group, ''), coalesce(p_opt_in, false), 1)
  on conflict (email) do update set
    first_name  = case when wr.user_id is not null and v_form then wr.first_name
                       else coalesce(nullif(excluded.first_name, ''), wr.first_name) end,
    last_name   = case when wr.user_id is not null and v_form then wr.last_name
                       else coalesce(nullif(excluded.last_name, ''), wr.last_name) end,
    company     = case when wr.user_id is not null and v_form then wr.company
                       else coalesce(excluded.company, wr.company) end,
    role        = case when wr.user_id is not null and v_form then wr.role
                       else coalesce(excluded.role, wr.role) end,
    frame_group = case when wr.user_id is not null and v_form then wr.frame_group
                       else coalesce(excluded.frame_group, wr.frame_group) end,
    opt_in      = wr.opt_in or excluded.opt_in,
    user_id     = coalesce(wr.user_id, excluded.user_id),
    claim_count = wr.claim_count + 1,
    last_seen   = now()
  returning wr.id, (wr.xmax = 0), wr.claim_count into v_id, v_inserted, v_count;

  insert into weekly_claims (reader_id, issue_no, via, user_id, ua, ip_hash, referer)
  values (v_id, p_issue_no, p_via, p_user_id, p_ua, p_ip_hash, p_referer)
  returning id into v_claim;

  return jsonb_build_object(
    'reader_id', v_id,
    'claim_id', v_claim,
    'is_returning', not v_inserted,
    'claim_count', v_count
  );
end
$$;

revoke all on function public.weekly_claim(text, text, text, text, text, text, boolean, integer, text, text, text, uuid, text) from public;
revoke all on function public.weekly_claim(text, text, text, text, text, text, boolean, integer, text, text, text, uuid, text) from anon;
revoke all on function public.weekly_claim(text, text, text, text, text, text, boolean, integer, text, text, text, uuid, text) from authenticated;
