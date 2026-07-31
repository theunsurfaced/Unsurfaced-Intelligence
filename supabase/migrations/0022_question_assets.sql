-- 0022_question_assets.sql
-- SEAM:STIMULUS (DB side)
-- Idempotent. Two columns, nothing else: assets move from a study-level
-- decoration to a per-question stimulus. One study reacts to one asset, the
-- next asks ten questions about ten different ones — same schema.
--
-- No new policies: study_question already carries question_read (live studies
-- + owning partner + admin) and question_write (owning partner) plus the admin
-- door from 0016. New columns ride those policies untouched. The asset BYTES
-- live in R2 behind /media/ as before; these columns are the pointer and the
-- filename the renderer uses to pick image / video / audio / html treatment.

alter table public.study_question add column if not exists asset_key  text;
alter table public.study_question add column if not exists asset_name text;
