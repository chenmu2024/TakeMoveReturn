create or replace function private.transfer_worker_tools(
  p_source_worker_id uuid, p_tool_ids uuid[], p_to_worker_id uuid, p_location_id uuid
)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_company_id uuid;
  v_target_id uuid;
  v_location_id uuid;
  v_tool_ids uuid[];
  v_tool_id uuid;
  v_distinct_count integer;
begin
  if p_tool_ids is null or cardinality(p_tool_ids) not between 1 and 25
    or array_position(p_tool_ids, null) is not null then raise exception 'Invalid selection'; end if;
  select count(distinct selected.tool_id) into v_distinct_count
    from unnest(p_tool_ids) as selected(tool_id);
  if v_distinct_count <> cardinality(p_tool_ids) then raise exception 'Invalid selection'; end if;

  select company_id into v_company_id from public.workers where id = p_source_worker_id for update;
  if not found then raise exception 'Worker not found'; end if;
  if not private.can_manage_company(v_company_id) then raise exception 'Forbidden'; end if;
  if p_to_worker_id = p_source_worker_id then raise exception 'Invalid worker'; end if;
  select id into v_target_id from public.workers
    where id = p_to_worker_id and company_id = v_company_id and status = 'active' for update;
  if v_target_id is null then raise exception 'Invalid worker'; end if;
  select id into v_location_id from public.locations
    where id = p_location_id and company_id = v_company_id and active for share;
  if v_location_id is null then raise exception 'Invalid location'; end if;

  select array(select t.id from public.tools t
    where t.id = any(p_tool_ids) and t.company_id = v_company_id
      and t.current_worker_id = p_source_worker_id and t.status = 'checked_out'
    order by t.id for update) into v_tool_ids;
  if cardinality(v_tool_ids) <> cardinality(p_tool_ids) then raise exception 'Ineligible tools'; end if;

  foreach v_tool_id in array v_tool_ids loop
    perform private.record_tool_transaction(v_tool_id, 'transfer', p_to_worker_id,
      p_location_id, 'Transferred from worker profile');
  end loop;
  return cardinality(v_tool_ids);
end;
$$;
