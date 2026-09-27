create index tools_company_worker_status_idx on public.tools (company_id, current_worker_id, status)
  where current_worker_id is not null;

create function private.return_worker_tools(p_worker_id uuid, p_location_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_company_id uuid;
  v_tool_ids uuid[];
  v_tool_id uuid;
begin
  select company_id into v_company_id from public.workers where id = p_worker_id for update;
  if not found then raise exception 'Worker not found'; end if;
  if not private.can_manage_company(v_company_id) then raise exception 'Forbidden'; end if;
  if not exists (select 1 from public.locations
    where id = p_location_id and company_id = v_company_id and active)
    then raise exception 'Invalid location'; end if;

  select array(select id from public.tools
    where company_id = v_company_id and current_worker_id = p_worker_id
    order by id for update) into v_tool_ids;
  if cardinality(v_tool_ids) = 0 then raise exception 'No tools to return'; end if;
  if cardinality(v_tool_ids) > 100 then raise exception 'Too many tools'; end if;
  if exists (select 1 from public.tools where id = any(v_tool_ids) and status <> 'checked_out')
    then raise exception 'Ineligible tools'; end if;

  foreach v_tool_id in array v_tool_ids loop
    perform private.record_tool_transaction(v_tool_id, 'return', null, p_location_id, 'Returned from worker profile');
  end loop;
  return cardinality(v_tool_ids);
end;
$$;
revoke all on function private.return_worker_tools(uuid,uuid) from public;
grant execute on function private.return_worker_tools(uuid,uuid) to authenticated;

create function public.return_worker_tools(p_worker_id uuid, p_location_id uuid)
returns integer language sql security invoker set search_path = '' as $$
  select private.return_worker_tools(p_worker_id, p_location_id);
$$;
revoke all on function public.return_worker_tools(uuid,uuid) from public, anon;
grant execute on function public.return_worker_tools(uuid,uuid) to authenticated;
