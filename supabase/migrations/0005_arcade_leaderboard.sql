-- ==================================================================
-- 0005_arcade_leaderboard.sql
-- ARCADE leaderboard spine: players, scores, public rank view.
-- Safe to run on top of 0001-0004. Idempotent.
-- ==================================================================

-- Players. Email is PRIVATE: stored here, exposed nowhere below.
create table if not exists public.arcade_players (
  id          uuid primary key default gen_random_uuid(),
  handle      text not null,
  email       text not null,
  created_at  timestamptz not null default now()
);

-- Handle uniqueness, case-insensitive.
create unique index if not exists arcade_players_handle_uniq
  on public.arcade_players (lower(handle));

-- Scores. Inserted by the Worker (service role) only, after HMAC
-- session-token validation. `valid` flips true post plausibility check.
create table if not exists public.arcade_scores (
  id          bigint generated always as identity primary key,
  player_id   uuid not null references public.arcade_players(id) on delete cascade,
  game        text not null check (game in ('rps','claw','pop')),
  score       bigint not null check (score >= 0),
  meta        jsonb not null default '{}'::jsonb,
  season      text not null,
  valid       boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists arcade_scores_board_idx
  on public.arcade_scores (game, season, valid, score desc);

-- Lock the base tables completely: RLS on, no policies = deny all
-- direct access for anon/authenticated. Service role bypasses RLS.
alter table public.arcade_players enable row level security;
alter table public.arcade_scores  enable row level security;
revoke all on public.arcade_players from anon, authenticated;
revoke all on public.arcade_scores  from anon, authenticated;

-- The ONLY public read path. Definer view owned by postgres: exposes
-- handle / game / score / season / rank. The email column is
-- structurally unreachable from here. Best score per player per
-- game+season; validated scores only.
create or replace view public.leaderboard_public as
select
  p.handle,
  s.game,
  s.season,
  max(s.score)                                        as score,
  rank() over (
    partition by s.game, s.season
    order by max(s.score) desc
  )                                                   as rank
from public.arcade_scores s
join public.arcade_players p on p.id = s.player_id
where s.valid
group by p.handle, s.game, s.season;

grant select on public.leaderboard_public to anon, authenticated;

-- At most one live board row per handle per game+season is guaranteed
-- by the group-by; joining twice with the same handle is prevented by
-- arcade_players_handle_uniq.
