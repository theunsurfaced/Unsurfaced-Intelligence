-- ==================================================================
-- 0035_report_stand.sql  (EX7b · THE COUNTER)
-- The report shelf on the stand, and the orders behind it.
--   1. report_issues: a Cultural Intelligence Report published to the
--      stand, one row per issue, pointing at the PDF the platform
--      rendered (house_reads.meta.pdf) and the public story photo that
--      is its cover. Draft rows never leak; the stand reads published.
--   2. report_orders: one row per paid Stripe Checkout session, written
--      once (the session id is unique) whether the buyer came back to
--      the stand or only the webhook arrived. The signed download link is
--      issued from the order; a returning buyer gets a fresh one by the
--      email they paid with.
-- Service-role only. Run once in the Supabase SQL editor. Idempotent.
-- ==================================================================

create table if not exists public.report_issues (
  issue_no        int primary key,
  house_read_id   bigint references public.house_reads(id) on delete set null,
  title           text not null,
  subtitle        text,
  ground_line     text,
  thesis          text,
  window_start    date,
  window_end      date,
  cover_story_id  bigint,
  cover_credit    text,
  r2_key          text,
  page_count      int,
  byte_size       bigint,
  price_cents     int not null default 2000,
  currency        text not null default 'usd',
  status          text not null default 'draft' check (status in ('draft', 'published', 'withdrawn')),
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.report_issues enable row level security;
revoke all on public.report_issues from anon, authenticated;

create table if not exists public.report_orders (
  id                    uuid primary key default gen_random_uuid(),
  issue_no              int not null references public.report_issues(issue_no),
  stripe_session_id     text not null unique,
  stripe_payment_intent text,
  email                 text,
  email_norm            text,
  amount_cents          int,
  currency              text,
  status                text not null default 'paid' check (status in ('paid', 'refunded')),
  via                   text,
  downloads             int not null default 0,
  ip_hash               text,
  created_at            timestamptz not null default now()
);
create index if not exists report_orders_email_idx on public.report_orders (email_norm, issue_no);
alter table public.report_orders enable row level security;
revoke all on public.report_orders from anon, authenticated;
