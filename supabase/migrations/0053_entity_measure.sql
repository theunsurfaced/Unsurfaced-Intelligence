-- 0053_entity_measure.sql  EX52b THE ENTITIES, arc 2: the measure on the links (SEAM:ENTITY_MEASURE). Idempotent.
-- An entity records from when its links are complete (resolved_from): the twelve-week backfill sets it for every entity it covered;
-- an entity added later is backfilled alone, at once, over the same twelve weeks. The resolver takes an optional entity so one
-- entity can be run over the whole window without touching the rest.
alter table public.entities add column if not exists resolved_from timestamptz;

drop function if exists public.resolve_signal_entities(timestamptz, timestamptz);
create or replace function public.resolve_signal_entities(p_since timestamptz, p_until timestamptz default now(), p_entity uuid default null)
returns table (signals_seen bigint, links_made bigint, entities_run int) language plpgsql security definer as $$
declare e record; pat text; ctx text; n_seen bigint := 0; n_made bigint := 0; n_ent int := 0; n_rows bigint;
begin
  select count(*) into n_seen from public.signals s where s.captured_at >= p_since and s.captured_at < p_until and s.status <> 'rejected';
  for e in select id, name, aliases, ambiguous, context from public.entities where active and (p_entity is null or id = p_entity) loop
    pat := public.entity_pattern(array_prepend(e.name, e.aliases));
    if pat is null then continue; end if;
    n_ent := n_ent + 1;
    ctx := case when e.ambiguous and array_length(e.context, 1) is not null then public.entity_pattern(e.context) else null end;
    insert into public.signal_entities (signal_id, entity_id, how, matched, captured_at)
    select s.id, e.id, 'alias', left(substring(coalesce(s.title, '') || ' ' || coalesce(s.summary, '') from ('(?i)(' || pat || ')')), 80), s.captured_at
    from public.signals s
    where s.captured_at >= p_since and s.captured_at < p_until and s.status <> 'rejected'
      and (coalesce(s.title, '') || ' ' || coalesce(s.summary, '')) ~* pat
      and (ctx is null or (coalesce(s.title, '') || ' ' || coalesce(s.summary, '')) ~* ctx)
    on conflict do nothing;
    get diagnostics n_rows = row_count;
    n_made := n_made + n_rows;
  end loop;
  return query select n_seen, n_made, n_ent;
end $$;
grant execute on function public.resolve_signal_entities(timestamptz, timestamptz, uuid) to service_role;
