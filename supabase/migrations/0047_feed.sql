-- ==================================================================
-- 0047_feed.sql  (EX45 THE FEED, SEAM:FEED_BRIDGE)
-- A FEED drop becomes one thing with a name: every chunk of a drop shares its drop_key; title is how the drop is
-- cited in reads and STUDIO; shareable is the hold (false: the drop feeds the reads and never a public asset).
-- Older rows keep drop_key null and are listed one row a drop. Idempotent; safe on top of 0001-0046.
-- ==================================================================
alter table public.knowledge_base add column if not exists drop_key text;
alter table public.knowledge_base add column if not exists title text;
alter table public.knowledge_base add column if not exists shareable boolean not null default false;
create index if not exists knowledge_base_drop_idx on public.knowledge_base (drop_key);
