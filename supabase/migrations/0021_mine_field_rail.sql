-- 0021_mine_field_rail.sql
-- SEAM:FIELD_RAIL + SEAM:RESPONSE_QUALITY + SEAM:CLIENT_LENS (DB side)
-- Idempotent. Opens the paid-study fielding rail and the client's read.
--
-- Why this migration is deliberately boring: every judgement call in this arc
-- (quality scoring, aggregation, the small-N floor) lives in the worker, where
-- it is provable in node. SQL that can only be parse-checked gets columns and
-- policies, nothing that decides anything.
--
-- Panel reality that forced this: 3 responder profiles. A paid study cannot be
-- fielded from the panel, and mineGuestRespond hard-rejects paid studies at the
-- anonymous door (correct — money plus an anonymous link is a fraud magnet).
-- Tokens are the paid door: one single-use credential per invited person.

-- ═══ SEAM:FIELD_RAIL — study_invite becomes a fielding instrument ═══════════
-- It was a mailing list: (study_id, email), no key, no state. Now every invite
-- is an addressable, single-use credential with a lifecycle.

alter table public.study_invite add column if not exists id uuid not null default gen_random_uuid();

-- The live table already carries a composite primary key (study_id, email) —
-- discovered the honest way, by the FK refusing. So id gets its own UNIQUE
-- constraint rather than a PK: that is all a foreign key needs, and it works
-- whether or not the composite PK exists.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.study_invite'::regclass
      and conname = 'study_invite_id_uq'
  ) then
    alter table public.study_invite add constraint study_invite_id_uq unique (id);
  end if;
end $$;

alter table public.study_invite add column if not exists token text;
alter table public.study_invite add column if not exists name text;
-- pending | sent | responded | screened | revoked
alter table public.study_invite add column if not exists status text not null default 'pending';
alter table public.study_invite add column if not exists sent_at timestamptz;
alter table public.study_invite add column if not exists responded_at timestamptz;
alter table public.study_invite add column if not exists created_at timestamptz not null default now();

-- Tokens are minted in the worker (crypto.getRandomValues) so this migration
-- carries no pgcrypto dependency. Uniqueness is enforced here regardless.
create unique index if not exists study_invite_token_uq
  on public.study_invite (token) where token is not null;

-- One invite per email per study. Guarded: if legacy rows already collide the
-- index is skipped with a notice rather than failing the whole migration.
do $$
begin
  begin
    create unique index if not exists study_invite_once
      on public.study_invite (study_id, lower(email));
  exception when unique_violation then
    raise notice 'study_invite_once skipped — duplicate (study_id, email) rows exist; dedupe then re-run';
  end;
end $$;

-- ═══ SEAM:RESPONSE_QUALITY — money attracts gaming ═════════════════════════
-- Free studies get lazy responses; paid studies get farmed ones. Every response
-- now carries how long it took, what the scan flagged, and where it stands in
-- review. quality_status: unreviewed | clean | flagged | rejected. Only
-- 'rejected' is excluded from the client read — a flag is a prompt to look,
-- not a verdict.

alter table public.response add column if not exists started_at timestamptz;
alter table public.response add column if not exists duration_ms integer;
alter table public.response add column if not exists quality jsonb not null default '{}'::jsonb;
alter table public.response add column if not exists quality_status text not null default 'unreviewed';
alter table public.response add column if not exists invite_id uuid;

-- Per-response consent record. The checkbox was a gate that evaporated; this is
-- the receipt: which text they agreed to, and when. The consent copy promises a
-- deletion right — the admin delete policy below is the mechanism behind it.
alter table public.response add column if not exists consent_version text;
alter table public.response add column if not exists consent_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.response'::regclass and conname = 'response_invite_fk'
  ) then
    alter table public.response add constraint response_invite_fk
      foreign key (invite_id) references public.study_invite(id) on delete set null;
  end if;
end $$;

create index if not exists response_study_quality_idx
  on public.response (study_id, quality_status);

-- The deletion path. response had no UPDATE or DELETE policy at all, so a
-- withdrawal request had no mechanism. Admin-only by design: a partner must not
-- be able to delete responses that disagree with them.
drop policy if exists response_admin_delete on public.response;
create policy response_admin_delete on public.response
  for delete using (public.is_admin());

drop policy if exists response_admin_update on public.response;
create policy response_admin_update on public.response
  for update using (public.is_admin()) with check (public.is_admin());

-- ═══ SEAM:CLIENT_LENS — read-only access, scoped to one study ══════════════
-- A client is not a partner. Handing a client a partner_profile would grant
-- study_partner_all (ALL, including DELETE) over the study they are paying to
-- watch. This table is the whole grant: one user, one study, read-only, and
-- every read still routes through the worker so no PII is ever selectable.

create table if not exists public.study_client (
  id         uuid primary key default gen_random_uuid(),
  study_id   uuid not null references public.study(id) on delete cascade,
  user_id    uuid not null,
  email      text,
  created_at timestamptz not null default now(),
  unique (study_id, user_id)
);

alter table public.study_client enable row level security;

-- A client may see that their own grant exists (the page uses it to decide
-- whether to show the client view). Nothing else is readable from the client.
drop policy if exists study_client_self_select on public.study_client;
create policy study_client_self_select on public.study_client
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists study_client_admin_all on public.study_client;
create policy study_client_admin_all on public.study_client
  for all using (public.is_admin()) with check (public.is_admin());

-- Partner who owns the study may manage its client grants.
drop policy if exists study_client_partner_all on public.study_client;
create policy study_client_partner_all on public.study_client
  for all using (
    exists (select 1 from public.study s
            join public.partner_profile p on p.id = s.partner_id
            where s.id = study_client.study_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.study s
            join public.partner_profile p on p.id = s.partner_id
            where s.id = study_client.study_id and p.owner_id = auth.uid())
  );

create index if not exists study_client_user_idx on public.study_client (user_id);
