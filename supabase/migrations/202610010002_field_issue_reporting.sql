-- Field-worker damage and missing reports.
-- The public RPC is callable only by service_role and still validates the
-- worker session, enrolled device, tenant, QR token and tool state.

alter table public.damage_reports
  add column reported_by_worker_id uuid references public.workers(id) on delete set null;

create index damage_reports_reported_by_worker_idx
  on public.damage_reports(reported_by_worker_id, created_at desc)
  where reported_by_worker_id is not null;

create function public.report_field_tool_issue(
  p_session_hash text,
  p_device_hash text,
  p_qr_token text,
  p_severity text,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.worker_sessions;
  v_device public.field_device_sessions;
  v_worker public.workers;
  v_tool public.tools;
  v_report_id uuid;
  v_description text := btrim(coalesce(p_description, ''));
begin
  if length(coalesce(p_session_hash, '')) <> 64
    or length(coalesce(p_device_hash, '')) <> 64
    or length(coalesce(p_qr_token, '')) <> 64 then
    raise exception 'Invalid field credentials';
  end if;
  if p_severity not in ('minor', 'needs_repair', 'unusable', 'lost')
    or char_length(v_description) not between 3 and 1000 then
    raise exception 'Invalid report';
  end if;

  select * into v_session
  from public.worker_sessions
  where session_token_hash = p_session_hash
  for update;
  if not found then raise exception 'Session expired'; end if;

  select * into v_device
  from public.field_device_sessions
  where id = v_session.device_session_id;

  select * into v_worker
  from public.workers
  where id = v_session.worker_id;

  if v_session.revoked_at is not null
    or v_session.idle_expires_at <= now()
    or v_session.absolute_expires_at <= now()
    or v_device.device_token_hash <> p_device_hash
    or v_device.revoked_at is not null
    or v_device.expires_at <= now()
    or v_worker.status <> 'active'
    or v_worker.auth_version <> v_session.worker_auth_version
    or v_worker.company_id <> v_session.company_id
    or v_device.company_id <> v_session.company_id then
    raise exception 'Session expired';
  end if;

  select * into v_tool
  from public.tools
  where qr_token = p_qr_token
  for update;
  if not found or v_tool.company_id <> v_session.company_id then
    raise exception 'Tool not found';
  end if;
  if v_tool.status = 'retired' then raise exception 'Retired tool'; end if;
  if exists (
    select 1 from public.damage_reports
    where tool_id = v_tool.id and status = 'open'
  ) then
    raise exception 'Open report exists';
  end if;

  insert into public.damage_reports(
    company_id, tool_id, reported_by_worker_id, severity, description
  ) values (
    v_session.company_id, v_tool.id, v_worker.id, p_severity, v_description
  )
  returning id into v_report_id;

  update public.tools
  set status = case
        when p_severity = 'lost' then 'missing'::public.tool_status
        else 'damaged'::public.tool_status
      end,
      condition = case
        when p_severity = 'unusable' then 'unusable'
        else condition
      end,
      revision = revision + 1,
      updated_at = now()
  where id = v_tool.id;

  insert into public.tool_transactions(
    company_id, tool_id, transaction_type,
    from_worker_id, to_worker_id,
    from_location_id, to_location_id,
    performed_by_worker_id, notes
  ) values (
    v_session.company_id, v_tool.id,
    case
      when p_severity = 'lost' then 'missing'::public.transaction_type
      else 'damage'::public.transaction_type
    end,
    v_tool.current_worker_id, v_tool.current_worker_id,
    v_tool.current_location_id, v_tool.current_location_id,
    v_worker.id, v_description
  );

  update public.worker_sessions
  set last_activity_at = now(),
      idle_expires_at = least(now() + interval '15 minutes', absolute_expires_at)
  where id = v_session.id;

  return v_report_id;
end;
$$;

revoke all on function public.report_field_tool_issue(text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.report_field_tool_issue(text, text, text, text, text)
  to service_role;
