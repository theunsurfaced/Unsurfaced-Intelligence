-- ==================================================================
-- 0012_beats.sql
-- SLATE: every DAILY story carries its beat from birth.
-- beat — one of the five coverage lanes (creativity, advertising,
--   tech, ai, culture), carried MECHANICALLY from the ingest query
--   that surfaced the signal — never assigned by a model.
-- Rides the existing edition_items RLS (published-only reads,
-- Worker writes). Safe on top of 0001-0011. Idempotent.
-- ==================================================================

alter table public.edition_items
  add column if not exists beat text;
