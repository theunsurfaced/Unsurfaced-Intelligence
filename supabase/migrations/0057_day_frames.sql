-- 0057_day_frames.sql  RD1b THE DAY'S FRAMES (SEAM:DAY_FRAMES). Idempotent.
-- A DAILY day's frame copy, written by the house writer under Method 5.0 after the edition publishes (or from the DAILY room by
-- an admin), kept on the edition row: the cover line, one frame per story (kicker, headline, line, the story's id for its
-- photograph), the caption, when and by whom it was written, what it cost, and a hold when a figure was not in the stories.
-- A drop from the feed lands on the same set as a frame of its own (from: feed, the drop's key). The frames are drawn in the
-- browser in the WEEKLY grammar; nothing is rendered here. STUDIO's content_pieces stays as the archive; nothing is deleted.
alter table public.editions add column if not exists frames jsonb;
comment on column public.editions.frames is 'RD1b: the day''s frame copy {v, status, cover_line, frames[{item_id, kicker, headline, line, source_name, from, drop_key}], caption, at, by, model, cost_usd, hold}';
