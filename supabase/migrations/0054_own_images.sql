-- 0054_own_images.sql  ED2 THE EDITOR (SEAM:EDIT_DESK, SEAM:MEDIA_RIGHTS). Idempotent.
-- The house's own photograph is a rights kind of its own: 'own', basis A, cleared for every context; the credit and the release
-- note the admin gave ride on the record. Nothing else about media_rights changes.
alter table public.media_rights drop constraint if exists media_rights_kind_check;
alter table public.media_rights add constraint media_rights_kind_check check (kind in ('house', 'press', 'cc', 'story_obj', 'story_thumb', 'type', 'own'));
