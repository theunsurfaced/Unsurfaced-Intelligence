-- ==================================================================
-- 0011_content_engine.sql
-- STUDIO: the content engine's memory of record.
-- content_pieces — one row per generated piece. Templates + payload
--   are deterministic, so a row IS the asset in potential; binaries
--   archive to R2 only at deploy (archive_key). Statuses:
--   draft -> approved -> deployed | killed.
-- Lanes: perishable (daily, hard-capped), durable (weekly batch),
--   event (fires on trigger: study listed, season closed).
-- Access: service-role locked. The Worker's admin-gated /studio/*
--   routes are the only door. Safe on top of 0001-0010. Idempotent.
-- ==================================================================

create table if not exists public.content_pieces (
  id          bigint generated always as identity primary key,
  day         date not null,
  lane        text not null check (lane in ('perishable','durable','event')),
  format      text not null check (format in
              ('signal_still','the_six','kinetic_take','hand_meme','bounty_card','board_weekly')),
  platform    text not null check (platform in ('instagram','tiktok','linkedin')),
  copy        jsonb not null default '{}'::jsonb,   -- hook, caption, hashtags, slide text
  payload     jsonb not null default '{}'::jsonb,   -- data the template renders from
  status      text not null check (status in ('draft','approved','deployed','killed'))
              default 'draft',
  deployed_at timestamptz,
  post_url    text,
  archive_key text,                                  -- R2 key, written at deploy
  created_at  timestamptz not null default now()
);

create index if not exists content_pieces_day_idx
  on public.content_pieces (day desc, status);

alter table public.content_pieces enable row level security;
revoke all on public.content_pieces from anon, authenticated;
