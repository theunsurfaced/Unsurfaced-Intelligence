-- ==================================================================
-- 0028_themes.sql  (EX2a · THEMES)
-- The lake's clusters are near-restatements (CONNECT joins at 0.80 cosine,
-- so 14,000 signals sit in 11,900 clusters). A THEME groups stories about the
-- same subject across outlets and weeks. Each theme keeps the running sum of
-- its members' embeddings (sumvec); cosine similarity ignores magnitude, so
-- the sum stands in for the centroid with no division. A story joins the
-- nearest theme whose bar it clears (p_sim 0.65 for a single story, rising
-- with the theme's size so no theme drifts into a whole territory) or starts one.
-- Oldest first, so the archive seeds and the new day joins.
-- DAILY's clusters, echo rule and momentum are untouched; theme_id is a new
-- column beside cluster_id. Safe on top of 0001-0027. Idempotent.
-- ==================================================================

create table if not exists public.themes (
  id          uuid primary key default gen_random_uuid(),
  sumvec      vector(384) not null,
  n           integer not null default 0,
  first_seen  timestamptz,
  last_seen   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists themes_sumvec_idx
  on public.themes using hnsw (sumvec vector_cosine_ops);
alter table public.themes enable row level security;
revoke all on public.themes from anon, authenticated;

alter table public.signals
  add column if not exists theme_id uuid references public.themes(id) on delete set null;
create index if not exists signals_theme_idx on public.signals (theme_id);

-- Older signature out of the way first: two overloads would make theme_assign(2000) ambiguous.
drop function if exists public.theme_assign(int, float);

create or replace function public.theme_assign(p_limit int default 1500, p_sim float default 0.65, p_step float default 0.015)
returns table (assigned int, created int, remaining int)
language plpgsql
as $$
declare
  r record;
  t record;
  tid uuid;
  bar float;
  c_assigned int := 0;
  c_created  int := 0;
  c_rem      int := 0;
begin
  for r in
    select s.id, s.embedding, coalesce(s.published_at, s.captured_at) as at
    from public.signals s
    where s.theme_id is null
      and s.embedding is not null
      and s.status in ('filtered', 'connected', 'published')
    order by coalesce(s.published_at, s.captured_at) asc
    limit p_limit
  loop
    tid := null;
    -- The five nearest themes, closest first. A theme's bar rises with its
    -- size (p_sim + p_step * log2 n): 0.65 for a single story, 0.71 at 16,
    -- 0.74 at 64, 0.77 at 256. A big theme takes only close kin, so it cannot
    -- drift into "sneaker news in general"; a story that misses a giant tries
    -- the next theme before starting its own.
    for t in
      select th.id, th.n, 1 - (th.sumvec <=> r.embedding) as sim
        from public.themes th
       order by th.sumvec <=> r.embedding
       limit 5
    loop
      bar := p_sim + p_step * log(2, greatest(t.n, 1)::numeric)::float;
      if t.sim >= bar then
        tid := t.id;
        exit;
      end if;
    end loop;
    if tid is not null then
      update public.themes
         set sumvec = sumvec + r.embedding,
             n = n + 1,
             first_seen = least(first_seen, r.at),
             last_seen = greatest(last_seen, r.at),
             updated_at = now()
       where id = tid;
      c_assigned := c_assigned + 1;
    else
      insert into public.themes (sumvec, n, first_seen, last_seen)
      values (r.embedding, 1, r.at, r.at)
      returning id into tid;
      c_created := c_created + 1;
    end if;
    update public.signals set theme_id = tid where id = r.id;
  end loop;
  select count(*) into c_rem
    from public.signals s
   where s.theme_id is null and s.embedding is not null
     and s.status in ('filtered', 'connected', 'published');
  return query select c_assigned, c_created, c_rem;
end
$$;

revoke all on function public.theme_assign(int, float, float) from public, anon, authenticated;
grant execute on function public.theme_assign(int, float, float) to service_role;

-- The scoreboard's open calls were made on cluster fragments, never a fair
-- test; they would all resolve as "faded" against theme keys. Resolved calls
-- stay as history.
delete from public.cluster_calls where resolved_at is null;

select 'themes ready' as status
where exists (select 1 from pg_proc where proname = 'theme_assign')
  and exists (select 1 from information_schema.columns
              where table_name = 'signals' and column_name = 'theme_id');
