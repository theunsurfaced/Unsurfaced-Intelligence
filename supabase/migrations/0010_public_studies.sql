-- ==================================================================
-- 0010_public_studies.sql
-- MINE: partner-controlled public study listing.
-- public_listing — opt-IN flag (default false). When true AND the
--   study is live with audience='open', it appears on the public
--   MINE study board. Contacts/invite-only studies never list,
--   regardless of the flag (the Worker enforces audience='open').
-- Access: anon/authenticated gain NO new read path here — the
--   Worker (service role) is the only public door, and it returns
--   only safe fields (never partner_id, never invites).
-- Partners flip the flag through their existing RLS update rights
-- on their own rows. Safe on top of 0001-0009. Idempotent.
-- ==================================================================

alter table public.study
  add column if not exists public_listing boolean not null default false;
