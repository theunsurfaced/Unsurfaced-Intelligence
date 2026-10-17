-- 0049_asks.sql  EX48 THE ASK: a member asks the team for more (SEAM:ASK_TEAM). Idempotent.
create table if not exists member_asks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text,
  group_id uuid,
  plan text,
  kind text not null default 'other' check (kind in ('insight','search','read','other')),
  ref text,
  ref_title text,
  question text not null,
  status text not null default 'new' check (status in ('new','answered','offered','closed')),
  reply text,
  offer text check (offer in ('recon','brief','none')),
  answered_by text,
  answered_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists member_asks_status on member_asks (status, created_at);
create index if not exists member_asks_user on member_asks (user_id, created_at desc);
alter table member_asks enable row level security;
