-- Keep privileged implementations outside the exposed public API schema.
grant usage on schema private to anon;

create function private.is_active_member(target_company_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_members
    where company_id = target_company_id and user_id = auth.uid() and status = 'active'
  );
$$;
revoke all on function private.is_active_member(uuid) from public;
grant execute on function private.is_active_member(uuid) to anon, authenticated;

create or replace function public.is_active_member(target_company_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.is_active_member(target_company_id);
$$;

create function private.can_manage_company(target_company_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_members
    where company_id = target_company_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'admin', 'manager')
  );
$$;
revoke all on function private.can_manage_company(uuid) from public;
grant execute on function private.can_manage_company(uuid) to anon, authenticated;

create or replace function public.can_manage_company(target_company_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.can_manage_company(target_company_id);
$$;

create function private.is_valid_worker_session(target_session_id uuid, target_company_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.worker_sessions session
    join public.workers worker on worker.id = session.worker_id
    join public.field_device_sessions device on device.id = session.device_session_id
    where session.id = target_session_id
      and session.company_id = target_company_id
      and worker.company_id = target_company_id
      and device.company_id = target_company_id
      and worker.status = 'active'
      and worker.auth_version = session.worker_auth_version
      and session.revoked_at is null
      and device.revoked_at is null
      and session.idle_expires_at > now()
      and session.absolute_expires_at > now()
      and device.expires_at > now()
  );
$$;
revoke all on function private.is_valid_worker_session(uuid, uuid) from public;
grant execute on function private.is_valid_worker_session(uuid, uuid) to authenticated;

create or replace function public.is_valid_worker_session(target_session_id uuid, target_company_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.is_valid_worker_session(target_session_id, target_company_id);
$$;
revoke all on function public.is_valid_worker_session(uuid, uuid) from public, anon;
grant execute on function public.is_valid_worker_session(uuid, uuid) to authenticated;

create function private.record_tool_transaction(
  p_tool_id uuid,
  p_transaction_type public.transaction_type,
  p_to_worker_id uuid default null,
  p_to_location_id uuid default null,
  p_notes text default null
)
returns public.tool_transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  locked_tool public.tools;
  created_transaction public.tool_transactions;
  next_status public.tool_status;
begin
  select * into locked_tool from public.tools where id = p_tool_id for update;
  if not found then raise exception 'Tool not found'; end if;
  if not private.can_manage_company(locked_tool.company_id) then raise exception 'Forbidden'; end if;
  if locked_tool.status = 'retired' then raise exception 'Retired tools cannot move'; end if;
  if p_to_worker_id is not null and not exists (
    select 1 from public.workers
    where id = p_to_worker_id and company_id = locked_tool.company_id and status = 'active'
  ) then raise exception 'Invalid worker'; end if;
  if p_to_location_id is not null and not exists (
    select 1 from public.locations
    where id = p_to_location_id and company_id = locked_tool.company_id and active
  ) then raise exception 'Invalid location'; end if;

  if p_transaction_type = 'checkout' then
    if locked_tool.status <> 'available' then raise exception 'Tool is not available'; end if;
    if p_to_worker_id is null then raise exception 'Checkout requires a worker'; end if;
    next_status := 'checked_out';
  elsif p_transaction_type = 'return' then
    if locked_tool.status <> 'checked_out' then raise exception 'Tool is not checked out'; end if;
    next_status := 'available';
    p_to_worker_id := null;
  elsif p_transaction_type = 'transfer' then
    if locked_tool.status not in ('available', 'checked_out') then raise exception 'Tool cannot be transferred'; end if;
    next_status := (case when p_to_worker_id is null then 'available' else 'checked_out' end)::public.tool_status;
  elsif p_transaction_type = 'missing' then
    next_status := 'missing';
  elsif p_transaction_type = 'found' then
    next_status := 'available';
    p_to_worker_id := null;
  elsif p_transaction_type = 'retire' then
    next_status := 'retired';
    p_to_worker_id := null;
  else
    raise exception 'Use a dedicated workflow for this transaction type';
  end if;

  update public.tools
  set status = next_status,
      current_worker_id = p_to_worker_id,
      current_location_id = coalesce(p_to_location_id, current_location_id),
      retired_at = case when next_status = 'retired' then now() else retired_at end,
      revision = revision + 1,
      updated_at = now()
  where id = locked_tool.id;

  insert into public.tool_transactions (
    company_id, tool_id, transaction_type, from_worker_id, to_worker_id,
    from_location_id, to_location_id, performed_by_user_id, notes
  ) values (
    locked_tool.company_id, locked_tool.id, p_transaction_type,
    locked_tool.current_worker_id, p_to_worker_id, locked_tool.current_location_id,
    coalesce(p_to_location_id, locked_tool.current_location_id), auth.uid(), p_notes
  ) returning * into created_transaction;

  return created_transaction;
end;
$$;
revoke all on function private.record_tool_transaction(uuid, public.transaction_type, uuid, uuid, text) from public;
grant execute on function private.record_tool_transaction(uuid, public.transaction_type, uuid, uuid, text) to authenticated;

create or replace function public.record_tool_transaction(
  p_tool_id uuid,
  p_transaction_type public.transaction_type,
  p_to_worker_id uuid default null,
  p_to_location_id uuid default null,
  p_notes text default null
)
returns public.tool_transactions
language sql
security invoker
set search_path = ''
as $$
  select private.record_tool_transaction(p_tool_id, p_transaction_type, p_to_worker_id, p_to_location_id, p_notes);
$$;
revoke all on function public.record_tool_transaction(uuid, public.transaction_type, uuid, uuid, text) from public, anon;
grant execute on function public.record_tool_transaction(uuid, public.transaction_type, uuid, uuid, text) to authenticated;
