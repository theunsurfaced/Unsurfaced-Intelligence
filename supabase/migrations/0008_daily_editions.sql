-- ==================================================================
-- 0008_daily_editions.sql
-- DAILY publication: editions + their synthesized items.
-- Public reads the published edition; the Worker (service role) writes.
-- Safe to run on top of 0001-0007. Idempotent.
-- ==================================================================

-- One row per calendar day's issue.
create table if not exists public.editions (
  id          bigint generated always as identity primary key,
  issue_no    integer not null,
  date        date not null unique,
  status      text not null check (status in ('building','review','published')) default 'building',
  headline    text,                       -- the day's lead line (optional summary)
  created_at  timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists editions_pub_idx
  on public.editions (status, date desc);

-- Synthesized stories within an edition, in display order.
create table if not exists public.edition_items (
  id          bigint generated always as identity primary key,
  edition_id  bigint not null references public.editions(id) on delete cascade,
  ord         integer not null default 0,
  kicker      text,
  headline    text not null,
  standfirst  text,
  take        text not null,              -- the interpretive body (why now / who benefits / second-order)
  source_name text,
  source_url  text,
  embed_html  text,
  cluster_key text,                       -- dedup/grouping key from ingest
  created_at  timestamptz not null default now()
);

create index if not exists edition_items_order_idx
  on public.edition_items (edition_id, ord);

-- ── Access: public reads PUBLISHED editions only; Worker writes all. ──
alter table public.editions      enable row level security;
alter table public.edition_items enable row level security;

-- Public (anon) may read only published editions and their items.
drop policy if exists editions_public_read on public.editions;
create policy editions_public_read on public.editions
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists edition_items_public_read on public.edition_items;
create policy edition_items_public_read on public.edition_items
  for select to anon, authenticated
  using (exists (
    select 1 from public.editions e
    where e.id = edition_items.edition_id and e.status = 'published'
  ));

-- No anon writes anywhere; service role (Worker) bypasses RLS for the pipeline.
revoke insert, update, delete on public.editions      from anon, authenticated;
revoke insert, update, delete on public.edition_items from anon, authenticated;

-- Helper: next issue number (monotonic, gap-tolerant).
create or replace function public.next_issue_no()
returns integer language sql stable as $$
  select coalesce(max(issue_no), 0) + 1 from public.editions;
$$;
