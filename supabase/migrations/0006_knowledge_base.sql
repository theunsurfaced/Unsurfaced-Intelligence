-- ==================================================================
-- 0006_knowledge_base.sql
-- Dev knowledge feed: links + attachments -> chunks -> embeddings.
-- Consumed by knowledge_search() tool (sensitivity: internal —
-- Claude-direct only, never :free models). Safe on top of 0001-0005.
-- Idempotent.
-- ==================================================================

create extension if not exists vector;

create table if not exists public.knowledge_base (
  id           bigint generated always as identity primary key,
  content      text not null,
  embedding    vector(384),               -- gte-small, Supabase edge embeddings
  source_url   text,
  file_ref     text,                      -- path in private storage bucket
  submitted_by uuid not null,             -- admin profile id
  tags         text[] not null default '{}',
  target       text not null check (target in ('daily','intelligence','both')),
  status       text not null check (status in ('processing','live','failed'))
               default 'processing',
  fail_reason  text,
  created_at   timestamptz not null default now()
);

create index if not exists knowledge_base_target_idx
  on public.knowledge_base (target, status);

-- HNSW for similarity search on live rows.
create index if not exists knowledge_base_embedding_idx
  on public.knowledge_base using hnsw (embedding vector_cosine_ops);

-- Internal data: fully locked. Worker (service role) is the only door.
alter table public.knowledge_base enable row level security;
revoke all on public.knowledge_base from anon, authenticated;

-- The tool the model pool calls (via Worker, service role).
create or replace function public.knowledge_search(
  p_target text,
  p_query  vector(384),
  p_count  int default 8
)
returns table (
  id bigint, content text, source_url text, tags text[],
  submitted_by uuid, created_at timestamptz, similarity float
)
language sql stable
as $$
  select kb.id, kb.content, kb.source_url, kb.tags,
         kb.submitted_by, kb.created_at,
         1 - (kb.embedding <=> p_query) as similarity
  from public.knowledge_base kb
  where kb.status = 'live'
    and (kb.target = p_target or kb.target = 'both')
    and kb.embedding is not null
  order by kb.embedding <=> p_query
  limit p_count;
$$;

revoke all on function public.knowledge_search(text, vector, int)
  from anon, authenticated;

-- Storage: create PRIVATE bucket `knowledge-drops` (dashboard or API);
-- no public access, service-role reads/writes only. Recorded here as
-- the migration's manual companion step.
