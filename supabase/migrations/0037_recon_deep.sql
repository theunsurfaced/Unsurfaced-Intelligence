-- 0037_recon_deep: the deep RECON's search and measure (EX17, SEAM:READ_DEEP).
-- Three changes, safe on top of 0001-0036, idempotent. Run it before deploying the worker.
-- 1. match_signals_span: the lake searched by meaning inside a date range (the period, or the years before it),
--    the same rows and rules as match_signals_read (no rejected rows, publish dates), with an upper bound. A period is
--    filtered first and ranked exactly (a date index serves it); the years before ride the vector index, asked to look
--    wider than its default. Each row says whether DAILY published it (edition_item_id), so a story is counted once.
-- 2. recon_evidence: what a deep RECON found, read and counted, one row per item, kept beside its read:
--    lake and record lines found by meaning, gathered stories, the voice pass step by step, sources read in full,
--    evidence cards, comment chunks and their labels, videos. Service role only; the worker is the only door.
-- 3. The Claude ledger accepts the `recon` tier: every dollar a RECON spends, on any model, on one ledger.

-- 1. the lake by meaning, bounded on both sides.
create index if not exists signals_when_idx on public.signals ((coalesce(published_at, captured_at)));
drop function if exists public.match_signals_span(vector, int, timestamptz, timestamptz, int, text);
create function public.match_signals_span(
  p_query     vector(384),
  p_count     int default 24,
  p_since     timestamptz default null,
  p_until     timestamptz default null,
  p_min_tier  int default 4,
  p_territory text default null
)
returns table (
  id uuid, url text, title text, summary text, source_name text,
  source_tier smallint, territory text, status text,
  published_at timestamptz, captured_at timestamptz, edition_item_id bigint, similarity float
)
language plpgsql stable
as $$
#variable_conflict use_column
declare
  n int := least(greatest(coalesce(p_count, 24), 1), 200);
begin
  if p_since is not null then
    -- A period: its rows first, then ranked exactly. The vector index ranks first and filters after, so a period of weeks
    -- inside years of rows came back with a handful of its forty.
    return query
      with win as materialized (
        select s.id, s.url, s.title, s.summary, s.source_name, s.source_tier, s.territory, s.status,
               s.published_at, s.captured_at, s.edition_item_id, s.embedding
        from public.signals s
        where coalesce(s.published_at, s.captured_at) >= p_since
          and (p_until is null or coalesce(s.published_at, s.captured_at) < p_until)
          and s.embedding is not null
          and s.status <> 'rejected'
          and s.source_tier <= p_min_tier
          and (p_territory is null or s.territory = p_territory)
      )
      select w.id, w.url, w.title, w.summary, w.source_name, w.source_tier, w.territory, w.status,
             w.published_at, w.captured_at, w.edition_item_id, (1 - (w.embedding <=> p_query))::float
      from win w
      order by w.embedding <=> p_query
      limit n;
  else
    -- The years before a period: most of the lake, so the vector index serves, looking at a thousand candidates, not forty. When
    -- the filters leave too few of them (a young lake, an early period), the rest is ranked exactly, so the count asked for comes
    -- back whenever the rows exist.
    perform set_config('hnsw.ef_search', '1000', true);
    return query
      with idx as materialized (
        select s.id, s.url, s.title, s.summary, s.source_name, s.source_tier, s.territory, s.status,
               s.published_at, s.captured_at, s.edition_item_id, (1 - (s.embedding <=> p_query))::float as sim
        from public.signals s
        where s.embedding is not null
          and s.status <> 'rejected'
          and s.source_tier <= p_min_tier
          and (p_territory is null or s.territory = p_territory)
          and (p_until is null or coalesce(s.published_at, s.captured_at) < p_until)
        order by s.embedding <=> p_query
        limit n
      ),
      more as (
        select s.id, s.url, s.title, s.summary, s.source_name, s.source_tier, s.territory, s.status,
               s.published_at, s.captured_at, s.edition_item_id, (1 - (s.embedding <=> p_query))::float as sim
        from public.signals s
        where s.embedding is not null
          and s.status <> 'rejected'
          and s.source_tier <= p_min_tier
          and (p_territory is null or s.territory = p_territory)
          and (p_until is null or coalesce(s.published_at, s.captured_at) < p_until)
          and s.id not in (select i.id from idx i)
        order by (s.embedding <=> p_query) + 0   -- "+ 0": ranked exactly, never by the index that just came back short
        limit greatest(n - (select count(*) from idx), 0)
      )
      select i.id, i.url, i.title, i.summary, i.source_name, i.source_tier, i.territory, i.status, i.published_at, i.captured_at, i.edition_item_id, i.sim from idx i
      union all
      select m.id, m.url, m.title, m.summary, m.source_name, m.source_tier, m.territory, m.status, m.published_at, m.captured_at, m.edition_item_id, m.sim from more m;
  end if;
end;
$$;
revoke all on function public.match_signals_span(vector, int, timestamptz, timestamptz, int, text) from public, anon, authenticated;
grant execute on function public.match_signals_span(vector, int, timestamptz, timestamptz, int, text) to service_role;

-- 2. the evidence a deep RECON stands on.
create table if not exists public.recon_evidence (
  id         bigint generated always as identity primary key,
  read_id    bigint not null references public.house_reads(id) on delete cascade,
  kind       text not null,
  ord        int not null default 0,
  ref        text,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.recon_evidence drop constraint if exists recon_evidence_kind_check;
alter table public.recon_evidence
  add constraint recon_evidence_kind_check check (kind in ('lake', 'record', 'web', 'voice', 'source', 'card', 'comments', 'labels', 'video'));
create index if not exists recon_evidence_read_kind_idx on public.recon_evidence (read_id, kind, ord);
alter table public.recon_evidence enable row level security;
revoke all on public.recon_evidence from anon, authenticated;

-- 3. the recon tier on the Claude ledger.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.claude_jobs'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%tier%'
  loop
    execute format('alter table public.claude_jobs drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.claude_jobs
  add constraint claude_jobs_tier_check check (tier in ('doc', 'ingest', 'live', 'frame', 'facts', 'recon'));

-- Check: three lines come back.
select 'match_signals_span ready' as status
where exists (select 1 from pg_proc where proname = 'match_signals_span')
union all
select 'recon_evidence ready'
where exists (select 1 from pg_constraint where conrelid = 'public.recon_evidence'::regclass and conname = 'recon_evidence_kind_check'
                and pg_get_constraintdef(oid) ilike '%voice%')
union all
select 'recon tier ledgered'
where exists (select 1 from pg_constraint where conrelid = 'public.claude_jobs'::regclass and conname = 'claude_jobs_tier_check'
                and pg_get_constraintdef(oid) ilike '%recon%');
