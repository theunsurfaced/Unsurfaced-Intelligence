-- NT1a THE SETS: the graph's name pattern, one more fix (SEAM:ENTITY_GRAPH). Idempotent: run it as many times as you like.
-- The Oct 29 fix gave each name its own word boundaries, but only where a letter or a digit sits at the name's edge. A name that ends in
-- a period ("Diaspora Co.") therefore lost its end boundary, and "diaspora communities" matched it. A trailing period adds nothing to a
-- match (a headline writes "Diaspora Co." or "Diaspora Co" alike), so it is dropped before the pattern is built and the boundary holds.
-- Everything else is the Oct 29 text, word for word.
create or replace function public.entity_pattern(p_names text[])
returns text language plpgsql immutable as $$
declare n text; parts text[] := '{}'; clean text;
begin
  foreach n in array coalesce(p_names, '{}'::text[]) loop
    clean := regexp_replace(btrim(coalesce(n, '')), '\s+', ' ', 'g');
    clean := regexp_replace(clean, '\.+$', '');      -- NT1a: a trailing period is dropped, so the end boundary holds
    if length(replace(clean, ' ', '')) < 3 then continue; end if;
    if length(regexp_replace(clean, '[^[:alnum:]]', '', 'g')) < 2 then continue; end if;
    clean := regexp_replace(clean, '([.^$|()\[\]{}*+?\\])', '\\\1', 'g');
    clean := replace(clean, '\.', '\.?');          -- a dot in a name is optional in a headline (Dr Martens, Dr. Martens)
    clean := replace(clean, ' ', '\s+');
    clean := (case when clean ~ '^[[:alnum:]]' then '\m' else '' end) || clean || (case when clean ~ '[[:alnum:]]$' then '\M' else '' end);
    parts := array_append(parts, clean);
  end loop;
  if array_length(parts, 1) is null then return null; end if;
  return '(?:' || array_to_string(parts, '|') || ')';
end $$;
