-- 0058_edition_voice.sql  VX1c THE VOICE, DAILY (SEAM:DAILY_VOICE). Idempotent.
-- An edition carries its voice notes on the row: meta.voice = {n, notes, at}, the faults Method 5.0 names found in the items the
-- house wrote (the take and the apply line in lake mode; the headline and the standfirst too in legacy mode). Notes, never a hold.
-- editions had no meta column before this; nothing else writes it. The published-only read policy on editions is unchanged, so the
-- notes are public with the edition they describe, as the record's violations are.
alter table public.editions add column if not exists meta jsonb not null default '{}'::jsonb;
