-- 0048_plans.sql  EX46 THE PLANS: groups, seats, plans and the credit ledger (SEAM:PLANS). Idempotent.
create table if not exists member_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null,
  plan text not null default 'engine' check (plan in ('member','engine','partner','retainer')),
  seats int not null default 1 check (seats between 1 and 500),
  credit_mode text not null default 'pool' check (credit_mode in ('pool','seat')),
  seat_credits int not null default 400 check (seat_credits >= 0),
  status text not null default 'active' check (status in ('active','paused')),
  billing text not null default 'desk' check (billing in ('desk','stripe')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists group_seats (
  group_id uuid not null references member_groups(id) on delete cascade,
  user_id uuid not null unique,
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create table if not exists credit_ledger (
  id bigserial primary key,
  group_id uuid not null references member_groups(id) on delete cascade,
  user_id uuid,
  period date not null,
  action text not null,
  credits int not null,
  cost_usd numeric(10,4),
  ref text,
  at timestamptz not null default now()
);
create index if not exists credit_ledger_group_period on credit_ledger (group_id, period);
create index if not exists credit_ledger_user_period on credit_ledger (user_id, period);
create unique index if not exists credit_ledger_refund_once on credit_ledger (ref) where action like 'refund:%';
alter table member_groups enable row level security;
alter table group_seats enable row level security;
alter table credit_ledger enable row level security;

-- One locked step: the group row is locked, the month's use is summed, the charge is written or refused.
create or replace function credit_spend(p_user uuid, p_action text, p_credits int, p_ref text default null, p_cost numeric default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s group_seats; g member_groups;
  per date := date_trunc('month', now() at time zone 'utc')::date;
  allow int; used int;
begin
  select * into s from group_seats where user_id = p_user;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_group'); end if;
  select * into g from member_groups where id = s.group_id for update;
  if g.status <> 'active' or g.plan = 'member' then
    return jsonb_build_object('ok', false, 'error', 'plan_required', 'plan', g.plan, 'status', g.status);
  end if;
  if g.credit_mode = 'pool' then
    allow := g.seats * g.seat_credits;
    select coalesce(sum(credits), 0) into used from credit_ledger where group_id = g.id and period = per;
  else
    allow := g.seat_credits;
    select coalesce(sum(credits), 0) into used from credit_ledger where group_id = g.id and period = per and user_id = p_user;
  end if;
  if p_credits > 0 and used + p_credits > allow then
    return jsonb_build_object('ok', false, 'error', 'credits_out', 'left', greatest(allow - used, 0), 'allowance', allow,
      'resets', (per + interval '1 month')::date, 'mode', g.credit_mode, 'plan', g.plan);
  end if;
  insert into credit_ledger (group_id, user_id, period, action, credits, cost_usd, ref)
    values (g.id, p_user, per, p_action, p_credits, p_cost, p_ref);
  return jsonb_build_object('ok', true, 'left', allow - used - p_credits, 'allowance', allow,
    'resets', (per + interval '1 month')::date, 'group', g.id, 'mode', g.credit_mode, 'plan', g.plan);
end $$;

-- A failed spend comes back once, into the month it was charged.
create or replace function credit_refund(p_ref text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r credit_ledger;
begin
  select * into r from credit_ledger where ref = p_ref and credits > 0 and action not like 'refund:%' order by id limit 1;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_charge'); end if;
  if exists (select 1 from credit_ledger where ref = p_ref and action like 'refund:%') then
    return jsonb_build_object('ok', true, 'already', true);
  end if;
  insert into credit_ledger (group_id, user_id, period, action, credits, cost_usd, ref)
    values (r.group_id, r.user_id, r.period, 'refund:' || r.action, -r.credits, null, p_ref);
  return jsonb_build_object('ok', true, 'credits', r.credits);
exception when unique_violation then
  return jsonb_build_object('ok', true, 'already', true);
end $$;

revoke all on function credit_spend(uuid, text, int, text, numeric) from public, anon, authenticated;
revoke all on function credit_refund(text) from public, anon, authenticated;
grant execute on function credit_spend(uuid, text, int, text, numeric) to service_role;
grant execute on function credit_refund(text) to service_role;
