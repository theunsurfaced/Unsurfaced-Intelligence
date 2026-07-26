-- 0018_mine_scale.sql
-- SEAM:MINE_SCALE (DB side)
-- Idempotent. Three rails toward a competitive research platform:
--   1. study.target_n — an optional response target; the trigger below closes
--      the study the moment the target is met, regardless of which rail the
--      response arrived on (guest via worker, responder via client insert).
--   2. study_question.pass_options — screener qualifying answers, held in the
--      DB and enforced worker-side for guests, client-side for responders.
--   3. response_count_close trigger — definer-security, so a responder's own
--      insert can flip a study they could never update themselves.

alter table public.study add column if not exists target_n int;
alter table public.study_question add column if not exists pass_options text[];

create or replace function public.response_after_insert_close()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare tgt int; n int;
begin
  select target_n into tgt from public.study where id = new.study_id;
  if tgt is not null and tgt > 0 then
    select count(*) into n from public.response where study_id = new.study_id;
    if n >= tgt then
      update public.study set status = 'closed' where id = new.study_id and status = 'live';
    end if;
  end if;
  return new;
end $fn$;

drop trigger if exists response_ai_close on public.response;
create trigger response_ai_close after insert on public.response
  for each row execute function public.response_after_insert_close();
