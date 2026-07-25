-- 0016_study_admin_delete.sql
-- SEAM:STUDY_DELETE + SEAM:STUDY_ADMIN + SEAM:FREE_STUDY (DB side)
-- Idempotent. Opens three doors the client build depends on:
--   1. Partners can DELETE their own studies (hard delete of drafts; children cascade).
--   2. Admin can UPDATE and DELETE any study, and manage its questions/invites.
--   3. Defensive rails for $0 studies: any CHECK constraint on pay_cents is dropped,
--      and 'archived' is guaranteed present on the study_status enum.
-- Partner update-own / question-own / invite-own policies already exist (the partner
-- edit flow works today) and are not touched.

-- ── rail 1: pay_cents must accept 0 — drop any CHECK constraint that mentions it ──
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.study'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%pay_cents%'
  loop
    execute format('alter table public.study drop constraint %I', c.conname);
    raise notice 'dropped check constraint % on public.study', c.conname;
  end loop;
end $$;

-- ── rail 2: the archive tier needs 'archived' on the enum (no-op if text or present) ──
do $$
begin
  if exists (select 1 from pg_type where typname = 'study_status') then
    if not exists (
      select 1 from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'study_status' and e.enumlabel = 'archived'
    ) then
      execute $q$alter type public.study_status add value 'archived'$q$;
    end if;
  end if;
end $$;

-- ── door 1: partner deletes their own studies ──
drop policy if exists study_partner_delete on public.study;
create policy study_partner_delete on public.study
  for delete using (
    exists (
      select 1 from public.partner_profile pp
      where pp.id = study.partner_id and pp.owner_id = auth.uid()
    )
  );

-- ── door 2: admin updates and deletes any study ──
drop policy if exists study_admin_update on public.study;
create policy study_admin_update on public.study
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists study_admin_delete on public.study;
create policy study_admin_delete on public.study
  for delete using (public.is_admin());

-- ── door 3: admin edit rewrites questions/invites on any study ──
drop policy if exists study_question_admin_all on public.study_question;
create policy study_question_admin_all on public.study_question
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists study_invite_admin_all on public.study_invite;
create policy study_invite_admin_all on public.study_invite
  for all using (public.is_admin()) with check (public.is_admin());
