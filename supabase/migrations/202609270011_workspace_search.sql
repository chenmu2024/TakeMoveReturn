create extension if not exists pg_trgm;

create index tools_company_search_idx on public.tools using gin
  ((name || ' ' || asset_code || ' ' || coalesce(brand, '') || ' ' || coalesce(model, '') || ' ' || coalesce(serial_number, '') || ' ' || coalesce(notes, '')) gin_trgm_ops);
create index workers_company_search_idx on public.workers using gin
  ((name || ' ' || coalesce(employee_code, '')) gin_trgm_ops);
create index locations_company_search_idx on public.locations using gin
  ((name || ' ' || coalesce(address, '') || ' ' || coalesce(notes, '')) gin_trgm_ops);

create function public.search_workspace(p_company_id uuid, p_query text)
returns table(result_type text, result_id uuid, title text, detail text)
language plpgsql security invoker set search_path = '' as $$
declare
  v_pattern text;
begin
  if p_query is null or char_length(btrim(p_query)) not between 2 and 100 then
    raise exception 'Invalid search';
  end if;
  if not public.is_active_member(p_company_id) then
    raise exception 'Forbidden';
  end if;
  v_pattern := '%' || replace(replace(replace(btrim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  return query
  select matches.result_type, matches.result_id, matches.title, matches.detail from (
    (select 'tool'::text as result_type, t.id as result_id, t.name as title,
      t.asset_code || coalesce(' · ' || t.brand, '') || coalesce(' ' || t.model, '') as detail
      from public.tools t where t.company_id = p_company_id
        and (t.name || ' ' || t.asset_code || ' ' || coalesce(t.brand, '') || ' ' || coalesce(t.model, '') || ' ' || coalesce(t.serial_number, '') || ' ' || coalesce(t.notes, '')) ilike v_pattern escape '\'
      order by t.name, t.id limit 10)
    union all
    (select 'worker'::text, w.id, w.name, coalesce(w.employee_code, 'Field worker')
      from public.workers w where w.company_id = p_company_id
        and (w.name || ' ' || coalesce(w.employee_code, '')) ilike v_pattern escape '\'
      order by w.name, w.id limit 10)
    union all
    (select 'location'::text, l.id, l.name, initcap(replace(l.type::text, '_', ' ')) || coalesce(' · ' || l.address, '')
      from public.locations l where l.company_id = p_company_id
        and ((l.name || ' ' || coalesce(l.address, '') || ' ' || coalesce(l.notes, '')) ilike v_pattern escape '\'
          or l.type::text ilike v_pattern escape '\')
      order by l.name, l.id limit 10)
  ) matches order by matches.result_type, matches.title, matches.result_id;
end;
$$;
revoke all on function public.search_workspace(uuid,text) from public, anon;
grant execute on function public.search_workspace(uuid,text) to authenticated;
