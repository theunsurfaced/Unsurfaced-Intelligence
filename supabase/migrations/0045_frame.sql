-- 0045_frame.sql
-- EX35e THE FRAME: a reader's frame is wider than brands. Idempotent. The worker writes
-- these through the service role; client_profile's policies stand as they are.
alter table if exists public.client_profile add column if not exists industries jsonb not null default '[]'::jsonb;  -- the house's territory slugs
alter table if exists public.client_profile add column if not exists audiences  jsonb not null default '[]'::jsonb;  -- the reader's words
alter table if exists public.client_profile add column if not exists keywords   jsonb not null default '[]'::jsonb;  -- lowercased
alter table if exists public.client_profile add column if not exists markets    jsonb not null default '[]'::jsonb;
alter table if exists public.client_profile add column if not exists declined   jsonb not null default '[]'::jsonb;  -- [{kind, value}] the house offered and the reader refused
