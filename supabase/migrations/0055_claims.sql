-- 0055_claims.sql  EX53 CLAIMS: findings as rows (SEAM:CLAIMS). Idempotent; run alone in the Supabase SQL editor before the worker.
-- A claim is one finding of one reading, kept as its own row: the sentence, the excerpt, the lens, the confidence the ground earned,
-- the band and dates of the lines it stands on, the lines themselves with their tiers, the frame, the reading it came from (an
-- overnight deployment or a live read), its marks and its grade. Claims link to the graph's entities: the entity the frame names,
-- and every entity the claim's own words carry. The record answers first from this table; the moves pass reads it.

-- Graph fix (Oct 29): a name that ends or begins with a character that is not a letter or a digit (Wallpaper*, Disney+, Apple TV+)
-- could never link, because the whole alternation was wrapped in \m ... \M and a word boundary cannot follow a * or a +.
-- Each name now carries its own boundaries, and only where a letter or a digit sits. Everything else is unchanged.
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
    clean := (case when clean ~ '^[[:alnum:]]' then '\m' else '' end) || clean || (case when clean ~ '[[:alnum:]]$' then '\M' else '' end);
    parts := array_append(parts, clean);
  end loop;
  if array_length(parts, 1) is null then return null; end if;
  return '(?:' || array_to_string(parts, '|') || ')';
end $$;

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  src text not null check (src in ('door', 'read')),   -- door_reads (an overnight deployment) or reads (a live read)
  reading_id text not null,                            -- the reading's id in that table
  idx int not null,                                    -- the finding's place in the reading, 0-based
  frame_key text,                                      -- the door's frame key; null for a live read
  night date,                                          -- the night it was compiled for (the door), or the day it was read
  written_at timestamptz not null default now(),
  claim text not null,                                 -- the finding's sentence (its title)
  excerpt text,
  lens text,                                           -- consumer | market | culture | brand
  confidence text,                                     -- High | Medium | Low, as the ground earned it
  band text,                                           -- NOW | RECENT | CURRENT | CONTEXT | ARCHIVE of the newest line
  newest date,
  oldest date,
  lines jsonb not null default '[]'::jsonb,            -- [{n, title, url, source, tier, date}] the lines it stands on
  tiers jsonb not null default '{}'::jsonb,            -- the tier mix of those lines: {"1": 2, "3": 1}
  frame jsonb not null default '{}'::jsonb,            -- {entity, category, audience, market, question}
  meaning jsonb,                                       -- a report's three meanings, when the reading had them
  on_record boolean not null default false,            -- a door deployment under the record law
  marks jsonb not null default '{}'::jsonb,            -- {held, useful, wrong} from the reading's marks
  grade text,                                          -- held | missed | unmeasured, from the reading's watch
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists claims_reading_idx_uq on public.claims (src, reading_id, idx);
create index if not exists claims_night_idx on public.claims (night desc);
create index if not exists claims_frame_key_idx on public.claims (frame_key) where frame_key is not null;

create table if not exists public.claim_entities (
  claim_id uuid not null references public.claims(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  how text not null default 'alias' check (how in ('frame', 'alias', 'hand')),
  primary key (claim_id, entity_id)
);
create index if not exists claim_entities_entity_idx on public.claim_entities (entity_id);

alter table public.claims enable row level security;
alter table public.claim_entities enable row level security;
grant select, insert, update, delete on public.claims to service_role;
grant select, insert, update, delete on public.claim_entities to service_role;

-- Links the given claims to the graph: the entity the claim's frame names (how frame; the name or an alias, case-blind), and every
-- active entity whose name or alias the claim's own words carry (how alias; an ambiguous entity needs a context word in the same
-- text, as the lake's resolver asks). A link already made is left alone. Returns what it linked.
create or replace function public.link_claim_entities(p_claims uuid[])
returns table (links_made bigint, entities_run int) language plpgsql security definer as $$
declare e record; pat text; ctx text; n_made bigint := 0; n_ent int := 0; n_rows bigint; names text[];
begin
  for e in select id, name, aliases, ambiguous, context from public.entities where active loop
    names := array_prepend(e.name, coalesce(e.aliases, '{}'::text[]));
    insert into public.claim_entities (claim_id, entity_id, how)
    select c.id, e.id, 'frame' from public.claims c
    where c.id = any(p_claims)
      and lower(regexp_replace(btrim(coalesce(c.frame->>'entity', '')), '\s+', ' ', 'g')) in (select lower(regexp_replace(btrim(x), '\s+', ' ', 'g')) from unnest(names) x)
    on conflict do nothing;
    get diagnostics n_rows = row_count;
    n_made := n_made + n_rows;
    pat := public.entity_pattern(names);
    if pat is null then continue; end if;
    n_ent := n_ent + 1;
    ctx := case when e.ambiguous and array_length(e.context, 1) is not null then public.entity_pattern(e.context) else null end;
    insert into public.claim_entities (claim_id, entity_id, how)
    select c.id, e.id, 'alias' from public.claims c
    where c.id = any(p_claims)
      and (c.claim || ' ' || coalesce(c.excerpt, '')) ~* pat
      and (ctx is null or (c.claim || ' ' || coalesce(c.excerpt, '')) ~* ctx)
    on conflict do nothing;
    get diagnostics n_rows = row_count;
    n_made := n_made + n_rows;
  end loop;
  return query select n_made, n_ent;
end $$;
grant execute on function public.link_claim_entities(uuid[]) to service_role;

-- The corpus on a set of entities: every claim linked to any of them, newest first. p_deployed true keeps the door's deployments
-- under the record law only (what the house deployed); false reads every claim (what the house knows). The record answers first
-- from here, and the moves pass reads here.
create or replace function public.claim_corpus(p_entities uuid[], p_deployed boolean default false, p_since date default null, p_limit int default 40)
returns table (id uuid, src text, reading_id text, idx int, frame_key text, night date, claim text, excerpt text, lens text, confidence text, band text, newest date, tiers jsonb, grade text, marks jsonb, on_record boolean, how text)
language sql stable security definer as $$
  select x.id, x.src, x.reading_id, x.idx, x.frame_key, x.night, x.claim, x.excerpt, x.lens, x.confidence, x.band, x.newest, x.tiers, x.grade, x.marks, x.on_record, x.how
  from (
    select distinct on (c.id) c.id, c.src, c.reading_id, c.idx, c.frame_key, c.night, c.written_at, c.claim, c.excerpt, c.lens, c.confidence, c.band, c.newest, c.tiers, c.grade, c.marks, c.on_record, ce.how
    from public.claims c join public.claim_entities ce on ce.claim_id = c.id
    where ce.entity_id = any(p_entities)
      and (not p_deployed or c.on_record)
      and (p_since is null or c.night >= p_since)
    order by c.id, (ce.how = 'frame') desc
  ) x
  order by x.night desc nulls last, x.written_at desc, x.idx asc
  limit greatest(1, least(coalesce(p_limit, 40), 200))
$$;
grant execute on function public.claim_corpus(uuid[], boolean, date, int) to service_role;
