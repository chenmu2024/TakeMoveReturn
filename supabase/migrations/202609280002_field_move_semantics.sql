-- A field MOVE transfers a checked-out tool to another worker or location.
-- An available tool must be TAKE-n; repeating a MOVE with no custody/location
-- change must not append a misleading history event.
create or replace function public.record_field_tool_transaction(p_session_hash text,p_device_hash text,
  p_qr_token text,p_type public.transaction_type,p_location_id uuid,p_notes text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_session public.worker_sessions; v_device public.field_device_sessions;
  v_worker public.workers; v_tool public.tools; v_id uuid; v_status public.tool_status;
begin
  if p_type not in ('checkout','transfer','return') or length(p_notes) > 500 then raise exception 'Invalid action'; end if;
  select * into v_session from public.worker_sessions where session_token_hash = p_session_hash for update;
  if not found then raise exception 'Session expired'; end if;
  select * into v_device from public.field_device_sessions where id = v_session.device_session_id;
  select * into v_worker from public.workers where id = v_session.worker_id;
  if v_session.revoked_at is not null or v_session.idle_expires_at <= now()
    or v_session.absolute_expires_at <= now() or v_device.device_token_hash <> p_device_hash
    or v_device.revoked_at is not null or v_device.expires_at <= now()
    or v_worker.status <> 'active' or v_worker.auth_version <> v_session.worker_auth_version
    or v_worker.company_id <> v_session.company_id or v_device.company_id <> v_session.company_id
  then raise exception 'Session expired'; end if;
  select * into v_tool from public.tools where qr_token = p_qr_token for update;
  if not found or v_tool.company_id <> v_session.company_id then raise exception 'Tool not found'; end if;
  if not exists (select 1 from public.locations where id = p_location_id
    and company_id = v_session.company_id and active) then raise exception 'Invalid location'; end if;
  if p_type = 'checkout' and v_tool.status = 'available' then v_status := 'checked_out';
  elsif p_type = 'transfer' and v_tool.status = 'checked_out' then
    if v_tool.current_worker_id = v_worker.id and v_tool.current_location_id = p_location_id
    then raise exception 'Move requires a different worker or location'; end if;
    v_status := 'checked_out';
  elsif p_type = 'return' and v_tool.status = 'checked_out' and v_tool.current_worker_id = v_worker.id then v_status := 'available';
  else raise exception 'Tool state changed or action not permitted'; end if;
  update public.tools set status = v_status,
    current_worker_id = case when p_type = 'return' then null else v_worker.id end,
    current_location_id = p_location_id, revision = revision + 1, updated_at = now()
  where id = v_tool.id;
  insert into public.tool_transactions(company_id,tool_id,transaction_type,from_worker_id,to_worker_id,
    from_location_id,to_location_id,performed_by_worker_id,notes)
  values(v_session.company_id,v_tool.id,p_type,v_tool.current_worker_id,
    case when p_type = 'return' then null else v_worker.id end,
    v_tool.current_location_id,p_location_id,v_worker.id,p_notes) returning id into v_id;
  update public.worker_sessions set last_activity_at = now(),
    idle_expires_at = least(now() + interval '15 minutes', absolute_expires_at)
  where id = v_session.id;
  return v_id;
end;
$$;
