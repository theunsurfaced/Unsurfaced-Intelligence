-- 0059_assets.sql  AS1 THE ASSETS (SEAM:ASSETS, SEAM:MEDIA_RIGHTS). Idempotent.
-- PLAY's renders are rights records too: a new kind, play, written when a render finishes (the model, the prompt, the seconds, the
-- project and the user on the record), cleared for nothing until the slots' checks run on it at pick time. The archive of
-- renders made before this cut gets its records from the desk ({run: "assets_play"}). Nothing else about media_rights changes.
alter table public.media_rights drop constraint if exists media_rights_kind_check;
alter table public.media_rights add constraint media_rights_kind_check check (kind in ('house', 'press', 'cc', 'story_obj', 'story_thumb', 'type', 'own', 'play'));

-- The event log's platform list never carried play (0007 allowed four names), so every PLAY event the worker logged since
-- (render_submit, render_done, ref_uploaded, assemble_submit) was refused by the check and swallowed by logEvent. From here the
-- events land; nothing before this line can be recovered.
alter table public.activity_events drop constraint if exists activity_events_platform_check;
alter table public.activity_events add constraint activity_events_platform_check check (platform in ('intelligence', 'daily', 'arcade', 'home', 'play'));
