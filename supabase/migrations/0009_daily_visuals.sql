-- ==================================================================
-- 0009_daily_visuals.sql
-- DAILY: key visual + source language per story.
-- image_url — the source's own social/OG image, captured at ingest
--             (GDELT socialimage); never generated, never fabricated.
-- lang      — source language from ingest (lowercased GDELT name,
--             e.g. 'english', 'spanish'); drives the front-end's
--             READ IN ENGLISH translation affordance.
-- Columns ride the existing 0008 RLS policies (published-only reads,
-- Worker/service-role writes). Safe to run on top of 0001-0008.
-- Idempotent.
-- ==================================================================

alter table public.edition_items
  add column if not exists image_url text;

alter table public.edition_items
  add column if not exists lang text;

-- No policy changes: anon still reads only items of published editions;
-- anon/authenticated still have no write path (revoked in 0008).
