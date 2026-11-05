-- 0064_partner.sql  EX51 THE PARTNER (SEAM:PARTNER): a Partner or Retainer company's own intake, what the house delivers to it, its
-- schedule and its office hours. Read and written by the worker only (service role): row level security on and no grants, so no
-- browser reads these tables directly. Idempotent.

create table if not exists public.partner_intake (
  group_id    uuid primary key references public.member_groups(id) on delete cascade,
  brand       text,
  competitors text[] not null default '{}',
  markets     text[] not null default '{}',
  audiences   text[] not null default '{}',
  channels    text[] not null default '{}',
  questions   jsonb  not null default '[]'::jsonb,
  notes       text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);
alter table public.partner_intake enable row level security;
revoke all on public.partner_intake from anon, authenticated;

create table if not exists public.partner_deliveries (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.member_groups(id) on delete cascade,
  kind         text not null check (kind in ('read','recon','report','brief','session')),
  title        text not null,
  summary      text,
  url          text check (url is null or url like 'https://%'),
  delivered_at timestamptz not null default now(),
  created_by   text
);
create index if not exists partner_deliveries_group_idx on public.partner_deliveries (group_id, delivered_at desc);
alter table public.partner_deliveries enable row level security;
revoke all on public.partner_deliveries from anon, authenticated;

create table if not exists public.partner_schedule (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.member_groups(id) on delete cascade,
  kind       text not null check (kind in ('read','recon','report','session')),
  title      text not null,
  due        date not null,
  status     text not null default 'planned' check (status in ('planned','done','moved','cancelled')),
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists partner_schedule_group_idx on public.partner_schedule (group_id, status, due);
alter table public.partner_schedule enable row level security;
revoke all on public.partner_schedule from anon, authenticated;

create table if not exists public.partner_hours (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.member_groups(id) on delete cascade,
  on_date    date not null default current_date,
  minutes    int  not null check (minutes > 0 and minutes <= 1440),
  kind       text not null default 'office_hours' check (kind in ('session','office_hours')),
  note       text,
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists partner_hours_group_idx on public.partner_hours (group_id, on_date desc);
alter table public.partner_hours enable row level security;
revoke all on public.partner_hours from anon, authenticated;
