-- 0044_door.sql
-- EX34 THE DOOR: what the house keeps about a reader at the door. Idempotent.
-- app_user already carries id, email, role and status (pending | approved), which
-- is_approved() reads; this adds who they said they are and when they knocked, so
-- the house's mail and the watch line can name them. No policy changes: app_user's
-- client policies stand as they are; the worker writes these through the service role.
alter table if exists public.app_user add column if not exists name        text;
alter table if exists public.app_user add column if not exists company     text;
alter table if exists public.app_user add column if not exists title       text;
alter table if exists public.app_user add column if not exists knocked_at  timestamptz;
alter table if exists public.app_user add column if not exists approved_at timestamptz;
alter table if exists public.app_user add column if not exists created_at  timestamptz not null default now();
create index if not exists app_user_status_knocked_idx on public.app_user (status, knocked_at);
