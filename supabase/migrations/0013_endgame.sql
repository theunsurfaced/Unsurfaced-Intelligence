-- ==================================================================
-- 0013_endgame.sql
-- THE ENDGAME LOOP: skill mints the key, the claw spends it, the
-- Hand fulfills. Four tables, all service-role locked — the Worker's
-- token-validated and admin-gated routes are the only doors.
--   arcade_config       — one row: the rotating house code (+version),
--                         and what the claw currently holds.
--   arcade_achievements — the reveal ledger: one reveal per player per
--                         code version per achievement. Rotation re-arms.
--   arcade_claims       — winner tickets awaiting the Hand.
--   arcade_match_log    — generic match rail (RPS chain today; chess,
--                         checkers, thumb wrestling ride it tomorrow).
-- Safe on top of 0001-0012. Idempotent.
-- ==================================================================

create table if not exists public.arcade_config (
  id            int primary key default 1 check (id = 1),
  code          text not null default 'UNSURFACED',
  code_version  int  not null default 1,
  prize_name    text not null default 'The first prize',
  prize_blurb   text not null default '',
  prize_obj_key text,
  updated_at    timestamptz not null default now()
);

create table if not exists public.arcade_achievements (
  id              bigint generated always as identity primary key,
  player_id       uuid not null,
  game            text not null,
  achievement_key text not null,
  code_version    int  not null,
  created_at      timestamptz not null default now(),
  unique (player_id, game, achievement_key, code_version)
);

create table if not exists public.arcade_claims (
  id           bigint generated always as identity primary key,
  ticket       text not null unique,
  player_id    uuid not null,
  prize_name   text not null,
  prize_blurb  text not null default '',
  code_version int  not null,
  status       text not null check (status in ('open','fulfilled')) default 'open',
  created_at   timestamptz not null default now(),
  fulfilled_at timestamptz
);

create table if not exists public.arcade_match_log (
  id         bigint generated always as identity primary key,
  player_id  uuid not null,
  game       text not null,
  result     text not null check (result in ('win','loss')),
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists arcade_match_log_chain_idx
  on public.arcade_match_log (player_id, game, created_at desc);

alter table public.arcade_config       enable row level security;
alter table public.arcade_achievements enable row level security;
alter table public.arcade_claims       enable row level security;
alter table public.arcade_match_log    enable row level security;
revoke all on public.arcade_config       from anon, authenticated;
revoke all on public.arcade_achievements from anon, authenticated;
revoke all on public.arcade_claims       from anon, authenticated;
revoke all on public.arcade_match_log    from anon, authenticated;
