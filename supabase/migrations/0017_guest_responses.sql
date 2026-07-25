-- 0017_guest_responses.sql
-- SEAM:GUEST_LINK (DB side)
-- Idempotent. Free studies accept responses from a public link with no profile:
--   1. responder_id learns null — the response_bi trigger already nulls it under
--      service role (auth.uid() is null) and skips the profile block, so the
--      worker's GUEST-#### label and ZIP segment survive untouched. Verified
--      against the live trigger body before this was written.
--   2. guest_email / guest_zip columns — email is contact + dedup key, never
--      surfaced to partners (mine_study_responses selects neither).
--   3. One response per email per study, enforced by index, not honor system.
--   4. Every row must be somebody: a profile response or a guest with an email.

alter table public.response alter column responder_id drop not null;

alter table public.response add column if not exists guest_email text;
alter table public.response add column if not exists guest_zip text;

create unique index if not exists response_guest_once
  on public.response (study_id, lower(guest_email))
  where guest_email is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.response'::regclass
      and conname = 'response_guest_contact'
  ) then
    alter table public.response add constraint response_guest_contact
      check (responder_id is not null or guest_email is not null);
  end if;
end $$;
