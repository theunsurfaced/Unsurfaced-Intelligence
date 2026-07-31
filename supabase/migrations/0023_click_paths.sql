-- 0023_click_paths.sql
-- SEAM:CLICKPATH (DB side)
-- Idempotent. One column: behavior data beside stated data. clicks is a map of
-- question_id -> ordered event list, captured by the beacon the worker injects
-- into served HTML stimuli and sanitized server-side before it lands here.
-- Rides every existing response policy untouched.

alter table public.response add column if not exists clicks jsonb not null default '{}'::jsonb;
