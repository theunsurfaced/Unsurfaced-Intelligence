-- ==================================================================
-- 0061_spaces.sql
-- SEAM:SPACES (NT1 THE SPACES): the net's unit. A space is a row: what the
-- door reads (its key is the door's frame_key: theme:<cluster>, track:<id>,
-- brand:<slug>, cat:<slug>), who holds it (the house, or a paying seat), its
-- cadence and its state night by night. The house holds the board's subjects
-- and its own ventures and clients by hand; a seat holds its tracked brands
-- and followed categories. A reader may be granted a view of a space.
--   1. spaces        one row per key and holder
--   2. space_grants  a view of a space, granted by its holder or an admin
--   3. space_reads   a space only seats hold is read for them alone: the same
--                    row shape as door_reads, kept off every public surface
--   4. spaces_touch  the worker's one write per pass: insert or update many
--                    rows, a field left out keeps its value, entity_id and
--                    track_id are filled only while empty
-- Named 0061, not 0060: EX53b may take 0060.
-- Service role only. Run in the Supabase SQL editor after 0059. Idempotent.
-- ==================================================================

create table if not exists public.spaces (
  id                uuid primary key default gen_random_uuid(),
  key               text not null,                           -- the door's frame_key for this space
  kind              text not null default 'brand' check (kind in ('brand', 'entity', 'theme', 'category', 'frame')),
  name              text not null,
  entity_id         uuid references public.entities(id) on delete set null,
  track_id          uuid references public.tracks(id) on delete set null,
  category          text,
  frame             jsonb not null default '{}'::jsonb,      -- {query, names, subtitle, lens, context}
  held_by           text not null default 'house',           -- 'house', or the seat's user id
  holder_kind       text not null default 'house' check (holder_kind in ('house', 'seat', 'group')),
  pinned            boolean not null default false,          -- held by hand: considered every night, whatever the board ranks
  cadence           text not null default 'nightly' check (cadence in ('nightly', 'every_2', 'every_3', 'weekly')),
  considered_nights integer not null default 0,
  unmoved_nights    integer not null default 0,              -- considered nights in a row that did not move
  last_considered   date,
  last_compiled_at  date,
  last_read_id      uuid,                                    -- the row in door_reads (or space_reads) it last wrote
  movement          jsonb,                                   -- the measure the night it was last considered
  seen_on           date,                                    -- the last night the board's feed or tracks proposed it
  status            text not null default 'active' check (status in ('active', 'dormant')),
  since             date not null default current_date,
  created_by        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create unique index if not exists spaces_key_holder_uq on public.spaces (key, held_by);
create index if not exists spaces_key_idx on public.spaces (key);
create index if not exists spaces_holder_idx on public.spaces (held_by, status);
create index if not exists spaces_status_kind_idx on public.spaces (status, kind);
alter table public.spaces enable row level security;
revoke all on public.spaces from anon, authenticated;

create table if not exists public.space_grants (
  space_id   uuid not null references public.spaces(id) on delete cascade,
  user_id    uuid not null,
  granted_by text,
  at         timestamptz not null default now(),
  primary key (space_id, user_id)
);
create index if not exists space_grants_user_idx on public.space_grants (user_id);
alter table public.space_grants enable row level security;
revoke all on public.space_grants from anon, authenticated;

-- The private readings: door_reads' columns, defaults, checks and indexes (the unique
-- (frame_key, night) included, so the worker's upsert works the same way).
create table if not exists public.space_reads (like public.door_reads including all);
alter table public.space_reads enable row level security;
revoke all on public.space_reads from anon, authenticated;

create or replace function public.spaces_touch(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r jsonb;
  n integer := 0;
begin
  for r in select value from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    if coalesce(r->>'key', '') = '' then continue; end if;
    insert into public.spaces as s (key, kind, name, entity_id, track_id, category, frame, held_by, holder_kind, pinned, cadence,
                                    considered_nights, unmoved_nights, last_considered, last_compiled_at, last_read_id, movement,
                                    seen_on, status, created_by)
    values (r->>'key', coalesce(r->>'kind', 'brand'), coalesce(nullif(r->>'name', ''), r->>'key'),
            nullif(r->>'entity_id', '')::uuid, nullif(r->>'track_id', '')::uuid, r->>'category', coalesce(r->'frame', '{}'::jsonb),
            coalesce(nullif(r->>'held_by', ''), 'house'), coalesce(r->>'holder_kind', 'house'), coalesce((r->>'pinned')::boolean, false),
            coalesce(r->>'cadence', 'nightly'), coalesce((r->>'considered_nights')::integer, 0), coalesce((r->>'unmoved_nights')::integer, 0),
            (r->>'last_considered')::date, (r->>'last_compiled_at')::date, nullif(r->>'last_read_id', '')::uuid, r->'movement',
            (r->>'seen_on')::date, coalesce(r->>'status', 'active'), r->>'created_by')
    on conflict (key, held_by) do update set
      kind              = coalesce(r->>'kind', s.kind),
      name              = coalesce(nullif(r->>'name', ''), s.name),
      entity_id         = coalesce(s.entity_id, nullif(r->>'entity_id', '')::uuid),
      track_id          = coalesce(s.track_id, nullif(r->>'track_id', '')::uuid),
      category          = coalesce(r->>'category', s.category),
      frame             = case when r ? 'frame' then s.frame || coalesce(r->'frame', '{}'::jsonb) else s.frame end,
      holder_kind       = coalesce(r->>'holder_kind', s.holder_kind),
      pinned            = coalesce((r->>'pinned')::boolean, s.pinned),
      cadence           = coalesce(r->>'cadence', s.cadence),
      considered_nights = coalesce((r->>'considered_nights')::integer, s.considered_nights),
      unmoved_nights    = coalesce((r->>'unmoved_nights')::integer, s.unmoved_nights),
      last_considered   = coalesce((r->>'last_considered')::date, s.last_considered),
      last_compiled_at  = coalesce((r->>'last_compiled_at')::date, s.last_compiled_at),
      last_read_id      = coalesce(nullif(r->>'last_read_id', '')::uuid, s.last_read_id),
      movement          = coalesce(r->'movement', s.movement),
      seen_on           = coalesce((r->>'seen_on')::date, s.seen_on),
      status            = coalesce(r->>'status', s.status),
      created_by        = coalesce(s.created_by, r->>'created_by'),
      updated_at        = now();
    n := n + 1;
  end loop;
  return n;
end
$$;
revoke all on function public.spaces_touch(jsonb) from public, anon, authenticated;
grant execute on function public.spaces_touch(jsonb) to service_role;

-- The check: three rows, 'spaces ready', 'space_grants ready', 'space_reads ready'.
select t.tablename || ' ready' as ok
  from pg_tables t
 where t.schemaname = 'public' and t.tablename in ('spaces', 'space_grants', 'space_reads')
 order by 1;
