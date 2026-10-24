-- 0051_media_rights.sql  ED1 THE SLOTS (SEAM:MEDIA_RIGHTS, SEAM:READ_SLOTS, SEAM:LAKE_LOOK). Idempotent.
-- Every image the house publishes carries a rights record: what it is, where it came from, the basis it is used on,
-- the contexts it is cleared for, and (for a house image) how it was made and what the checks said. No record, no publish.
create table if not exists media_rights (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('house', 'press', 'cc', 'story_obj', 'story_thumb', 'type')),
  ref text not null,                              -- an R2 key (make/<hash>.jpg) or a story id (S123)
  source_url text,
  license_text text,                              -- the license or terms as snapshotted when the record was made
  credit text,
  basis text not null check (basis in ('AIR', 'EDIT', 'CC', 'OBJ', 'THUMB', 'A')),
  display_max_px int,
  contexts text[] not null default '{}',          -- weekly_pdf, stand_cover, social, card, web, recon, brief, api
  object_sentence text,                           -- for OBJ: the sentence in the read that makes this image the object of the finding
  made jsonb not null default '{}'::jsonb,        -- house: model, seed, prompt_version, brief, hash, checks {hard, advisory, shows}
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists media_rights_ref on media_rights (ref);
create index if not exists media_rights_kind_at on media_rights (kind, created_at desc);
alter table media_rights enable row level security;
-- the worker reads and writes with the service role; nothing reaches this table from the page
grant select, insert, update on media_rights to service_role;

-- SEAM:LAKE_LOOK: the lake as the teaching pass. A story photograph is described in words once (palette, light, setting,
-- composition); the description is what the brief writer and the similarity check read. Pixels never enter a model as training.
alter table edition_items add column if not exists image_desc text;
alter table edition_items add column if not exists image_desc_at timestamptz;
create index if not exists edition_items_image_desc_missing on edition_items (id) where image_desc is null and image_url is not null;
