-- 0052_entities.sql  EX52b THE ENTITIES, arc 1: the graph and the resolver (SEAM:ENTITY_GRAPH). Idempotent.
-- An entity is a thing the lake can count: a brand, a person, a product, an organisation. It carries its names (the name and its
-- aliases) and, when its name is also an ordinary word, the context words a story must also carry before the match counts
-- (Target the retailer, not a target). A signal is linked to every entity its title or summary names; the link carries the
-- signal's capture time so the measure never joins for a date. The resolver is the database's own function, run over a window of
-- capture time; the worker calls it on the half hour for the new rows and, until the twelve weeks are covered, for one backfill
-- step a slice. No model is asked in this arc.
create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'brand' check (kind in ('brand', 'person', 'product', 'org', 'place', 'other')),
  aliases text[] not null default '{}'::text[],
  category text,                                  -- the category noun the frame or the track gave ("retail", "athletic footwear")
  context text[] not null default '{}'::text[],   -- when ambiguous: a story must carry one of these words too
  ambiguous boolean not null default false,
  from_src text not null default 'frame' check (from_src in ('frame', 'track', 'scout', 'hand')),
  track_id uuid references public.tracks(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists entities_name_uq on public.entities (lower(name));
create index if not exists entities_active_idx on public.entities (active) where active;

create table if not exists public.signal_entities (
  signal_id uuid not null references public.signals(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  how text not null default 'alias' check (how in ('alias', 'scout', 'model', 'hand')),
  matched text,                                   -- the name or alias the story carried
  captured_at timestamptz not null,               -- the signal's capture time, copied, so the measure reads one table
  primary key (signal_id, entity_id)
);
create index if not exists signal_entities_entity_time_idx on public.signal_entities (entity_id, captured_at desc);

-- the resolver's cursors (k = 'cursor' for the half hour, 'backfill' for the twelve weeks)
create table if not exists public.entity_resolve_state (
  k text primary key,
  v jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.entities enable row level security;
alter table public.signal_entities enable row level security;
alter table public.entity_resolve_state enable row level security;
grant select, insert, update, delete on public.entities to service_role;
grant select, insert, update, delete on public.signal_entities to service_role;
grant select, insert, update, delete on public.entity_resolve_state to service_role;

-- A name as a regular expression that matches it as whole words, case-insensitively, with the pattern characters escaped.
-- Names under three characters, or with fewer than two letters or digits, are left out ("LG" and "***" never match the lake).
create or replace function public.entity_pattern(p_names text[])
returns text language plpgsql immutable as $$
declare n text; parts text[] := '{}'; clean text;
begin
  foreach n in array coalesce(p_names, '{}'::text[]) loop
    clean := regexp_replace(btrim(coalesce(n, '')), '\s+', ' ', 'g');
    if length(replace(clean, ' ', '')) < 3 then continue; end if;
    if length(regexp_replace(clean, '[^[:alnum:]]', '', 'g')) < 2 then continue; end if;
    clean := regexp_replace(clean, '([.^$|()\[\]{}*+?\\])', '\\\1', 'g');
    clean := replace(clean, '\.', '\.?');          -- a dot in a name is optional in a headline (Dr Martens, Dr. Martens)
    clean := replace(clean, ' ', '\s+');
    parts := array_append(parts, clean);
  end loop;
  if array_length(parts, 1) is null then return null; end if;
  return '\m(?:' || array_to_string(parts, '|') || ')\M';
end $$;

-- Links every signal captured in [p_since, p_until) to every active entity its title or summary names. A row already linked is
-- left alone. An ambiguous entity needs one of its context words in the same text. Returns what it saw and what it linked.
create or replace function public.resolve_signal_entities(p_since timestamptz, p_until timestamptz default now())
returns table (signals_seen bigint, links_made bigint, entities_run int) language plpgsql security definer as $$
declare e record; pat text; ctx text; n_seen bigint := 0; n_made bigint := 0; n_ent int := 0; n_rows bigint;
begin
  select count(*) into n_seen from public.signals s where s.captured_at >= p_since and s.captured_at < p_until and s.status <> 'rejected';
  for e in select id, name, aliases, ambiguous, context from public.entities where active loop
    pat := public.entity_pattern(array_prepend(e.name, e.aliases));
    if pat is null then continue; end if;
    n_ent := n_ent + 1;
    ctx := case when e.ambiguous and array_length(e.context, 1) is not null then public.entity_pattern(e.context) else null end;
    insert into public.signal_entities (signal_id, entity_id, how, matched, captured_at)
    select s.id, e.id, 'alias', left(substring(coalesce(s.title, '') || ' ' || coalesce(s.summary, '') from ('(?i)(' || pat || ')')), 80), s.captured_at
    from public.signals s
    where s.captured_at >= p_since and s.captured_at < p_until and s.status <> 'rejected'
      and (coalesce(s.title, '') || ' ' || coalesce(s.summary, '')) ~* pat
      and (ctx is null or (coalesce(s.title, '') || ' ' || coalesce(s.summary, '')) ~* ctx)
    on conflict do nothing;
    get diagnostics n_rows = row_count;
    n_made := n_made + n_rows;
  end loop;
  return query select n_seen, n_made, n_ent;
end $$;
grant execute on function public.entity_pattern(text[]) to service_role;
grant execute on function public.resolve_signal_entities(timestamptz, timestamptz) to service_role;

-- What the lake counts for one entity over a window, by week: the measure's own query in arc 2 reads this.
create or replace function public.entity_counts(p_entity uuid, p_since timestamptz, p_until timestamptz default now())
returns table (signal_id uuid, captured_at timestamptz, title text, url text, source_name text, source_tier smallint, territory text, published_at timestamptz, research boolean)
language sql stable security definer as $$
  select s.id, s.captured_at, s.title, s.url, s.source_name, s.source_tier, s.territory, s.published_at, s.research
  from public.signal_entities se join public.signals s on s.id = se.signal_id
  where se.entity_id = p_entity and se.captured_at >= p_since and se.captured_at < p_until and s.status <> 'rejected'
  order by se.captured_at desc
$$;
grant execute on function public.entity_counts(uuid, timestamptz, timestamptz) to service_role;
