-- ==================================================================
-- 0015_lake_composer.sql
-- THE COMPOSER'S FIELDS: signals carry their key visual from capture;
-- edition items carry territory, format, the APPLY line, provenance
-- back to their signal, and the momentum that earned the slot.
-- Safe on top of 0001-0014. Idempotent.
-- ==================================================================

alter table public.signals
  add column if not exists image text;

alter table public.edition_items
  add column if not exists territory text;
alter table public.edition_items
  add column if not exists format text;
alter table public.edition_items
  add column if not exists apply text;
alter table public.edition_items
  add column if not exists signal_id uuid references public.signals(id) on delete set null;
alter table public.edition_items
  add column if not exists momentum jsonb;

create index if not exists edition_items_signal_idx
  on public.edition_items (signal_id);
