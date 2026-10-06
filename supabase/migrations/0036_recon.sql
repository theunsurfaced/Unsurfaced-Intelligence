-- 0036_core: the RECON, a commissioned report that starts from a brief (SEAM:READ_RECON).
-- One change: house_reads.kind admits 'recon'. The brief lives in meta.brief {text, hash, frame, days};
-- the number in meta.recon_no; the gather receipt in meta.gather. Everything else the report kind uses, the RECON uses.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.house_reads'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%kind%'
  loop
    execute format('alter table public.house_reads drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.house_reads
  add constraint house_reads_kind_check
  check (kind in ('weekly', 'monthly', 'record', 'report', 'recon'));

-- The desk (SEAM:READ_DESK): standing inputs from the editors, one row per kind ('all' applies to every read).
-- Notes on a single read live on its row (house_reads.meta.notes); a revision is a new version of the row.
create table if not exists public.house_desk (
  kind        text primary key,
  inputs      text not null default '',
  updated_by  text,
  updated_at  timestamptz not null default now()
);
alter table public.house_desk enable row level security;
revoke all on public.house_desk from anon, authenticated;
