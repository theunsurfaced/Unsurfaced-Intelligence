-- 0050_checkout.sql  EX49 THE CHECKOUT AND THE INVITES (SEAM:CHECKOUT). Idempotent.
create table if not exists group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references member_groups(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  invited_by uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid,
  revoked_at timestamptz
);
create index if not exists group_invites_group on group_invites (group_id, created_at desc);
alter table group_invites enable row level security;
create unique index if not exists credit_ledger_topup_once on credit_ledger (ref) where action = 'topup';
-- one team a subscription: a webhook delivered twice can never make a second group
create unique index if not exists member_groups_subscription_once on member_groups ((meta->'stripe'->>'subscription')) where (meta->'stripe'->>'subscription') is not null;
-- who opened the door: a seat's approval is taken back when the seat is
alter table app_user add column if not exists approved_via text;

-- Taking a seat in one locked step: the group row is locked, the seats counted, the invite closed and the seat written together,
-- so two teammates taking the last seat at once cannot both get it.
create or replace function seat_take(p_group uuid, p_user uuid, p_invite uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare g member_groups; held int;
begin
  select * into g from member_groups where id = p_group for update;
  if not found or g.plan = 'member' or g.status <> 'active' then return jsonb_build_object('ok', false, 'error', 'plan_required'); end if;
  if exists (select 1 from group_seats where user_id = p_user) then return jsonb_build_object('ok', false, 'error', 'seat_elsewhere'); end if;
  select count(*) into held from group_seats where group_id = p_group;
  if held >= g.seats then return jsonb_build_object('ok', false, 'error', 'no_free_seat'); end if;
  update group_invites set accepted_at = now(), accepted_by = p_user
    where id = p_invite and group_id = p_group and accepted_at is null and revoked_at is null and expires_at > now();
  if not found then return jsonb_build_object('ok', false, 'error', 'invite_closed'); end if;
  insert into group_seats (group_id, user_id, role) values (p_group, p_user, 'member');
  return jsonb_build_object('ok', true);
end $$;
revoke all on function seat_take(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function seat_take(uuid, uuid, uuid) to service_role;
