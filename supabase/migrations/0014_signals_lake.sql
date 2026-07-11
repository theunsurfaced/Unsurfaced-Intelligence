-- ==================================================================
-- 0014_signals_lake.sql
-- THE SIGNALS LAKE: everything CAPTURE sees, kept — DAILY publishes
-- 12, the lake remembers all of it. One spine feeds three surfaces:
-- DAILY (edition composer), STUDIO (slate), EXCAVATE (recon search).
-- Embeddings: 384-dim (bge-small via Workers AI, own account — same
-- law as knowledge_base 0006). Worker (service role) is the only
-- door; EXCAVATE reads arrive through Worker endpoints, never anon.
-- Safe on top of 0001-0013. Idempotent.
-- ==================================================================

create extension if not exists vector;

create table if not exists public.signals (
  id             uuid primary key default gen_random_uuid(),
  url            text not null,
  content_hash   text not null,             -- dedup key: hash(title|url-root)
  title          text,
  summary        text,
  source_name    text,
  source_tier    smallint not null default 2
                 check (source_tier between 1 and 4),
  territory      text,                      -- one of DAILY_POV.territories
  format_hint    text,                      -- dispatch|read|signal|number|drop|provocation
  published_at   timestamptz,
  captured_at    timestamptz not null default now(),
  embedding      vector(384),
  momentum       jsonb,                     -- {novelty,velocity,breadth,depth,durability,relevance}
  cluster_id     uuid,                      -- CONNECT stage: neighbor group
  edition_item_id bigint references public.edition_items(id) on delete set null,
  status         text not null default 'raw'
                 check (status in ('raw','filtered','connected','published','rejected'))
);

create unique index if not exists signals_hash_uq
  on public.signals (content_hash);
create index if not exists signals_captured_idx
  on public.signals (captured_at desc);
create index if not exists signals_territory_idx
  on public.signals (territory, status);
create index if not exists signals_cluster_idx
  on public.signals (cluster_id);

-- HNSW for FILTER dedup + CONNECT neighbors + EXCAVATE search.
create index if not exists signals_embedding_idx
  on public.signals using hnsw (embedding vector_cosine_ops);

-- Lake is fully locked. Worker (service role) is the only door.
alter table public.signals enable row level security;
revoke all on public.signals from anon, authenticated;

-- The search the Worker calls for EXCAVATE + CONNECT (service role).
create or replace function public.match_signals(
  p_query     vector(384),
  p_count     int default 12,
  p_territory text default null,
  p_min_tier  int default 4,
  p_since     timestamptz default null
)
returns table (
  id uuid, url text, title text, summary text, source_name text,
  source_tier smallint, territory text, status text,
  captured_at timestamptz, momentum jsonb, similarity float
)
language sql stable
as $$
  select s.id, s.url, s.title, s.summary, s.source_name,
         s.source_tier, s.territory, s.status,
         s.captured_at, s.momentum,
         1 - (s.embedding <=> p_query) as similarity
  from public.signals s
  where s.embedding is not null
    and (p_territory is null or s.territory = p_territory)
    and s.source_tier <= p_min_tier
    and (p_since is null or s.captured_at >= p_since)
  order by s.embedding <=> p_query
  limit p_count;
$$;
