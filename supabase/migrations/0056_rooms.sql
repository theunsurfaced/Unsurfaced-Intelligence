-- 0056_rooms.sql  RM1 THE ROOMS ON THE GRAPH (SEAM:ENTITY_ROOM). Idempotent.
-- The rooms' list counts every entity on the links (signal_entities), by the measure's own rule: a story counts on the date it
-- speaks for (published_at, else captured_at); a research row and a rejected row never count; twelve rolling weeks ending now.
-- The room itself counts the same rows in the worker with the measure's function, so the room and the board agree. The function
-- also answers what the record holds on each entity: its claims, its deployments under the record law, held and missed.
create or replace function public.entity_rollup(p_ids uuid[], p_now timestamptz default now())
returns table (entity_id uuid, weeks integer[], outlets integer[], n7 integer, n30 integer, outlets30 integer, outlets84 integer, latest timestamptz,
               claims integer, deployed integer, held integer, missed integer)
language sql stable security definer as $$
  with hits as (
    select se.entity_id, coalesce(s.published_at, s.captured_at) as w, s.source_name
      from public.signal_entities se join public.signals s on s.id = se.signal_id
     where se.entity_id = any (p_ids) and se.captured_at >= p_now - interval '85 days'
       and s.research = false and s.status <> 'rejected'
  ),
  ok as (
    select entity_id, w, source_name, floor(extract(epoch from (p_now - w)) / 604800)::int as ago
      from hits where w is not null and w <= p_now and w > p_now - interval '84 days'
  ),
  wk as (select entity_id, 11 - ago as i, count(*)::int as n, count(distinct source_name)::int as o from ok group by entity_id, ago),
  tot as (
    select entity_id,
           count(*) filter (where w > p_now - interval '7 days')::int as n7,
           count(*) filter (where w > p_now - interval '30 days')::int as n30,
           count(distinct source_name) filter (where w > p_now - interval '30 days')::int as o30,
           count(distinct source_name)::int as o84,
           max(w) as latest
      from ok group by entity_id
  ),
  cl as (
    select ce.entity_id, count(distinct c.id)::int as claims,
           count(distinct c.reading_id) filter (where c.src = 'door' and c.on_record)::int as deployed,
           count(distinct c.reading_id) filter (where c.src = 'door' and c.on_record and c.grade = 'held')::int as held,
           count(distinct c.reading_id) filter (where c.src = 'door' and c.on_record and c.grade = 'missed')::int as missed
      from public.claim_entities ce join public.claims c on c.id = ce.claim_id
     where ce.entity_id = any (p_ids) group by ce.entity_id
  )
  select e.id,
         (select array_agg(coalesce(wk.n, 0) order by g.i) from generate_series(0, 11) as g(i) left join wk on wk.entity_id = e.id and wk.i = g.i),
         (select array_agg(coalesce(wk.o, 0) order by g.i) from generate_series(0, 11) as g(i) left join wk on wk.entity_id = e.id and wk.i = g.i),
         coalesce(tot.n7, 0), coalesce(tot.n30, 0), coalesce(tot.o30, 0), coalesce(tot.o84, 0), tot.latest,
         coalesce(cl.claims, 0), coalesce(cl.deployed, 0), coalesce(cl.held, 0), coalesce(cl.missed, 0)
    from public.entities e
    left join tot on tot.entity_id = e.id
    left join cl on cl.entity_id = e.id
   where e.id = any (p_ids)
$$;
grant execute on function public.entity_rollup(uuid[], timestamptz) to service_role;
