-- 0060_house_corpus.sql  VX2 THE CORPUS (SEAM:HOUSE_POSITIONS). Idempotent.
-- The house's own writing, kept apart from the lake: the decks, essays, talks and reports we wrote. A document is kept whole in R2
-- (corpus/<hash>.<ext>; a converted document's text beside it as corpus/<hash>.md, a text file being its own text) and listed here;
-- the public media route refuses corpus/. None of it enters knowledge_base, the lake or a read's
-- evidence. One reading of it (one call on the doc tier, on the batch) proposes the positions it holds, each standing on a quote from
-- its page, and the lines that show how the house writes, word for word, each labelled with the exemplar of Method 5.0 it matches.
-- Nothing reaches a writer until an admin approves it in THE CORPUS room. A document
-- marked confidential teaches the register only: no position is drawn from it, and the search below never returns one that was.
-- Embeddings are bge-small-en-v1.5 (384 dimensions) on our own account, the same as knowledge_base (0006).
create extension if not exists vector;

create table if not exists public.house_docs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null default 'deck' check (kind in ('deck', 'essay', 'talk', 'report', 'other')),
  confidential boolean not null default false,  -- the register only: no position is drawn from it
  pages int,                                     -- null when the converter marked no pages
  words int,
  chars int,
  source_ref text,                               -- R2: the original, as uploaded (corpus/<hash>.<ext>)
  text_ref text,                                 -- R2: the text the reading reads (corpus/<hash>.md, or the original when it is text)
  hash text,                                     -- sha256 of the original, 40 hex: the same file twice is one document
  name text,                                     -- the uploaded file's name
  status text not null default 'uploaded' check (status in ('uploaded', 'reading', 'extracted', 'retired')),   -- reading: sent on the batch, not landed
  extract jsonb not null default '{}'::jsonb,    -- the reading's receipt: what was sent and when, what it cost, what it proposed and what it set aside
  uploaded_by uuid,
  at timestamptz not null default now()
);
create unique index if not exists house_docs_hash_uq on public.house_docs (hash) where hash is not null;
create index if not exists house_docs_at on public.house_docs (at desc);

create table if not exists public.house_positions (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references public.house_docs(id) on delete cascade,
  page int,
  text text not null,                            -- the position, one or two sentences, in the house's words; never a figure
  quote text,                                    -- the passage on the page it stands on, word for word (null when written by hand)
  topics text[] not null default '{}',           -- lower-case names it touches: a brand, a category, an audience, a place
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'retired')),
  embedding vector(384),
  edited jsonb,                                  -- the last hand edit: {before, by, at}
  approved_by uuid,
  approved_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists house_positions_doc on public.house_positions (doc_id, status);
create index if not exists house_positions_status on public.house_positions (status);
create index if not exists house_positions_embedding_idx on public.house_positions using hnsw (embedding vector_cosine_ops);

create table if not exists public.house_register (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references public.house_docs(id) on delete cascade,
  page int,
  text text not null,                            -- the document's own words; the pool the next Method revision draws its exemplars from
  label text not null default 'other' check (label in ('opening', 'fact_then_line', 'idea_and_stakes', 'number_with_source', 'return_in_figures',
    'close_in_fragments', 'how_without_label', 'local_name', 'field_in_order', 'us_on_our_work', 'other')),   -- the exemplars of Method 5.0, What good looks like
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'retired')),
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists house_register_doc on public.house_register (doc_id, status);

-- The house's own writing is the house's: the worker reads and writes with the service role; nothing reaches these tables from a page.
alter table public.house_docs enable row level security;
alter table public.house_positions enable row level security;
alter table public.house_register enable row level security;
revoke all on public.house_docs from anon, authenticated;
revoke all on public.house_positions from anon, authenticated;
revoke all on public.house_register from anon, authenticated;
grant select, insert, update, delete on public.house_docs to service_role;
grant select, insert, update, delete on public.house_positions to service_role;
grant select, insert, update, delete on public.house_register to service_role;

-- The positions a read may meet: approved, embedded, from a document that is neither retired nor confidential, nearest the query
-- first. The worker ranks them again on the overlap of their topics with the read's subjects and keeps six at most.
create or replace function public.house_positions_search(p_query vector(384), p_count int default 24)
returns table (id uuid, doc_id uuid, page int, text text, topics text[], doc_title text, doc_kind text, similarity float)
language sql stable
as $$
  select p.id, p.doc_id, p.page, p.text, p.topics, d.title, d.kind, 1 - (p.embedding <=> p_query) as similarity
  from public.house_positions p
  join public.house_docs d on d.id = p.doc_id
  where p.status = 'approved'
    and p.embedding is not null
    and d.status <> 'retired'
    and not d.confidential
  order by p.embedding <=> p_query
  limit greatest(1, least(coalesce(p_count, 24), 60));
$$;
revoke all on function public.house_positions_search(vector, int) from anon, authenticated;
grant execute on function public.house_positions_search(vector, int) to service_role;
