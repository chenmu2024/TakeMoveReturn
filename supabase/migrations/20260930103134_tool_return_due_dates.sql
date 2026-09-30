-- Due dates are manager-only, company-scoped, and never grant custody access.
create function public.set_tool_return_due_date(p_tool_id uuid, p_due_at timestamptz)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_tool public.tools;
begin
  select * into v_tool from public.tools where id = p_tool_id for update;
  if not found or not public.can_manage_company(v_tool.company_id) then raise exception 'Forbidden'; end if;
  if v_tool.status <> 'checked_out' then raise exception 'Tool is not checked out'; end if;
  if p_due_at is not null and p_due_at <= now() then raise exception 'Due date must be in the future'; end if;
  if v_tool.expected_return_at is not distinct from p_due_at then return false; end if;
  update public.tools set expected_return_at = p_due_at, updated_at = now() where id = p_tool_id;
  insert into public.tool_transactions(company_id,tool_id,transaction_type,from_worker_id,to_worker_id,
    from_location_id,to_location_id,performed_by_user_id,notes)
  values(v_tool.company_id,v_tool.id,'correction',v_tool.current_worker_id,v_tool.current_worker_id,
    v_tool.current_location_id,v_tool.current_location_id,auth.uid(),
    case when p_due_at is null then 'Expected return date cleared'
      else 'Expected return date set to ' || to_char(p_due_at at time zone 'UTC','YYYY-MM-DD HH24:MI') || ' UTC' end);
  return true;
end;
$$;
revoke all on function public.set_tool_return_due_date(uuid,timestamptz) from public,anon;
grant execute on function public.set_tool_return_due_date(uuid,timestamptz) to authenticated;

create function private.clear_tool_return_due_date() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status <> 'checked_out' then new.expected_return_at := null; end if;
  return new;
end;
$$;
revoke all on function private.clear_tool_return_due_date() from public;
create trigger clear_tool_return_due_date before update of status on public.tools
for each row execute function private.clear_tool_return_due_date();

create index tools_company_overdue_idx on public.tools(company_id,expected_return_at)
where status = 'checked_out' and expected_return_at is not null;
