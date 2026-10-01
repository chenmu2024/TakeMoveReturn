-- Finish-mode hardening: company-local return dates, file cardinality, field issue reports,
-- auditable custody corrections, and lightweight maintenance work orders.

alter table public.tools
  add column if not exists expected_return_date date;

update public.tools t
set expected_return_date = (t.expected_return_at at time zone c.timezone)::date
from public.companies c
where t.company_id = c.id
  and t.expected_return_date is null
  and t.expected_return_at is not null;

drop function if exists public.set_tool_return_due_date(uuid,timestamptz);

create or replace function public.set_tool_return_due_date(p_tool_id uuid, p_due_date date)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_tool public.tools;
  v_timezone text;
  v_today date;
  v_due_at timestamptz;
begin
  select * into v_tool from public.tools where id = p_tool_id for update;
  if not found or not public.can_manage_company(v_tool.company_id) then raise exception 'Forbidden'; end if;
  if v_tool.status <> 'checked_out' then raise exception 'Tool is not checked out'; end if;

  select timezone into v_timezone from public.companies where id = v_tool.company_id;
  v_today := (pg_catalog.now() at time zone v_timezone)::date;
  if p_due_date is not null and p_due_date < v_today then raise exception 'Due date must not be in the past'; end if;

  if v_tool.expected_return_date is not distinct from p_due_date then return false; end if;

  v_due_at := case when p_due_date is null then null
    else ((p_due_date + time '23:59:59.999999') at time zone v_timezone) end;

  update public.tools
  set expected_return_date = p_due_date,
      expected_return_at = v_due_at,
      updated_at = pg_catalog.now()
  where id = p_tool_id;

  insert into public.tool_transactions(
    company_id,tool_id,transaction_type,from_worker_id,to_worker_id,
    from_location_id,to_location_id,performed_by_user_id,notes
  ) values (
    v_tool.company_id,v_tool.id,'correction',v_tool.current_worker_id,v_tool.current_worker_id,
    v_tool.current_location_id,v_tool.current_location_id,auth.uid(),
    case when p_due_date is null then 'Expected return date cleared'
      else 'Expected return date set to ' || p_due_date::text || ' (' || v_timezone || ')' end
  );
  return true;
end;
$$;

revoke all on function public.set_tool_return_due_date(uuid,date) from public,anon;
grant execute on function public.set_tool_return_due_date(uuid,date) to authenticated;

create or replace function private.clear_tool_return_due_date()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status <> 'checked_out' then
    new.expected_return_at := null;
    new.expected_return_date := null;
  end if;
  return new;
end;
$$;

create index if not exists tools_company_overdue_date_idx
  on public.tools(company_id,expected_return_date)
  where status = 'checked_out' and expected_return_date is not null;

create or replace function private.enforce_customer_file_entity_limits()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  if new.kind in ('tool_photo','damage_photo') and new.size_bytes > 5242880 then
    raise exception 'Images are limited to 5 MB';
  end if;
  if new.kind = 'maintenance_attachment' and new.size_bytes > 10485760 then
    raise exception 'Maintenance attachments are limited to 10 MB';
  end if;

  if new.kind = 'tool_photo' then
    select count(*) into v_count from public.customer_files
    where company_id = new.company_id and tool_id = new.tool_id
      and kind = 'tool_photo' and status in ('pending','ready');
    if v_count >= 1 then raise exception 'Tool already has an active primary image'; end if;
  elsif new.kind = 'damage_photo' then
    select count(*) into v_count from public.customer_files
    where company_id = new.company_id and damage_report_id = new.damage_report_id
      and kind = 'damage_photo' and status in ('pending','ready');
    if v_count >= 3 then raise exception 'Damage reports allow up to 3 photos'; end if;
  elsif new.kind = 'maintenance_attachment' then
    select count(*) into v_count from public.customer_files
    where company_id = new.company_id and maintenance_event_id = new.maintenance_event_id
      and kind = 'maintenance_attachment' and status in ('pending','ready');
    if v_count >= 3 then raise exception 'Maintenance events allow up to 3 attachments'; end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_customer_file_entity_limits() from public,anon,authenticated;

drop trigger if exists customer_file_entity_limits on public.customer_files;
create trigger customer_file_entity_limits
before insert on public.customer_files
for each row execute function private.enforce_customer_file_entity_limits();

alter table public.damage_reports
  add column if not exists reported_by_worker_id uuid references public.workers(id) on delete set null;

create or replace function public.report_field_tool_issue(
  p_session_hash text,
  p_device_hash text,
  p_qr_token text,
  p_issue_type text,
  p_severity text,
  p_description text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_session public.worker_sessions;
  v_device public.field_device_sessions;
  v_worker public.workers;
  v_tool public.tools;
  v_report_id uuid;
  v_severity text;
begin
  if p_issue_type not in ('damage','missing')
    or char_length(trim(coalesce(p_description,''))) not between 3 and 1000 then
    raise exception 'Invalid issue report';
  end if;

  v_severity := case when p_issue_type = 'missing' then 'lost' else p_severity end;
  if v_severity not in ('minor','needs_repair','unusable','lost') then
    raise exception 'Invalid issue severity';
  end if;

  select * into v_session from public.worker_sessions
  where session_token_hash = p_session_hash for update;
  if not found then raise exception 'Session expired'; end if;

  select * into v_device from public.field_device_sessions where id = v_session.device_session_id;
  select * into v_worker from public.workers where id = v_session.worker_id;
  if v_session.revoked_at is not null or v_session.idle_expires_at <= pg_catalog.now()
    or v_session.absolute_expires_at <= pg_catalog.now()
    or v_device.device_token_hash <> p_device_hash
    or v_device.revoked_at is not null or v_device.expires_at <= pg_catalog.now()
    or v_worker.status <> 'active' or v_worker.auth_version <> v_session.worker_auth_version
    or v_worker.company_id <> v_session.company_id or v_device.company_id <> v_session.company_id then
    raise exception 'Session expired';
  end if;

  select * into v_tool from public.tools where qr_token = p_qr_token for update;
  if not found or v_tool.company_id <> v_session.company_id then raise exception 'Tool not found'; end if;
  if v_tool.status = 'retired' then raise exception 'Retired tool'; end if;
  if exists (select 1 from public.damage_reports where tool_id = v_tool.id and status = 'open') then
    raise exception 'Open report exists';
  end if;

  insert into public.damage_reports(
    company_id,tool_id,reported_by_worker_id,severity,description
  ) values (
    v_session.company_id,v_tool.id,v_worker.id,v_severity,trim(p_description)
  ) returning id into v_report_id;

  update public.tools set
    status = case when p_issue_type = 'missing' then 'missing'::public.tool_status else 'damaged'::public.tool_status end,
    condition = case when v_severity = 'unusable' then 'unusable' else condition end,
    revision = revision + 1,
    updated_at = pg_catalog.now()
  where id = v_tool.id;

  insert into public.tool_transactions(
    company_id,tool_id,transaction_type,from_worker_id,to_worker_id,
    from_location_id,to_location_id,performed_by_worker_id,notes
  ) values (
    v_session.company_id,v_tool.id,
    case when p_issue_type = 'missing' then 'missing'::public.transaction_type else 'damage'::public.transaction_type end,
    v_tool.current_worker_id,v_tool.current_worker_id,
    v_tool.current_location_id,v_tool.current_location_id,
    v_worker.id,trim(p_description)
  );

  update public.worker_sessions
  set last_activity_at = pg_catalog.now(),
      idle_expires_at = least(pg_catalog.now() + interval '15 minutes', absolute_expires_at)
  where id = v_session.id;

  return v_report_id;
end;
$$;

revoke all on function public.report_field_tool_issue(text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.report_field_tool_issue(text,text,text,text,text,text) to service_role;

create or replace function public.correct_tool_custody(
  p_tool_id uuid,
  p_to_worker_id uuid,
  p_to_location_id uuid,
  p_reason text,
  p_reverses_transaction_id uuid default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_tool public.tools;
  v_tx uuid;
  v_status public.tool_status;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(trim(coalesce(p_reason,''))) not between 3 and 500 then raise exception 'Correction reason required'; end if;

  select * into v_tool from public.tools where id = p_tool_id for update;
  if not found or not public.can_manage_company(v_tool.company_id) then raise exception 'Forbidden'; end if;
  if v_tool.status not in ('available','checked_out') then raise exception 'Tool state cannot be corrected here'; end if;

  if p_to_worker_id is not null and not exists (
    select 1 from public.workers
    where id = p_to_worker_id and company_id = v_tool.company_id and status = 'active'
  ) then raise exception 'Invalid worker'; end if;

  if p_to_location_id is null or not exists (
    select 1 from public.locations
    where id = p_to_location_id and company_id = v_tool.company_id and active
  ) then raise exception 'Invalid location'; end if;

  if p_reverses_transaction_id is not null and not exists (
    select 1 from public.tool_transactions
    where id = p_reverses_transaction_id and tool_id = v_tool.id and company_id = v_tool.company_id
  ) then raise exception 'Invalid reversed transaction'; end if;

  v_status := case when p_to_worker_id is null then 'available'::public.tool_status else 'checked_out'::public.tool_status end;

  if v_tool.current_worker_id is not distinct from p_to_worker_id
    and v_tool.current_location_id is not distinct from p_to_location_id
    and v_tool.status = v_status then
    raise exception 'Correction must change current custody';
  end if;

  update public.tools set
    status = v_status,
    current_worker_id = p_to_worker_id,
    current_location_id = p_to_location_id,
    revision = revision + 1,
    updated_at = pg_catalog.now()
  where id = v_tool.id;

  insert into public.tool_transactions(
    company_id,tool_id,transaction_type,from_worker_id,to_worker_id,
    from_location_id,to_location_id,performed_by_user_id,notes,reverses_transaction_id
  ) values (
    v_tool.company_id,v_tool.id,'correction',
    v_tool.current_worker_id,p_to_worker_id,
    v_tool.current_location_id,p_to_location_id,
    auth.uid(),trim(p_reason),p_reverses_transaction_id
  ) returning id into v_tx;

  return v_tx;
end;
$$;

revoke all on function public.correct_tool_custody(uuid,uuid,uuid,text,uuid) from public,anon;
grant execute on function public.correct_tool_custody(uuid,uuid,uuid,text,uuid) to authenticated;

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  status text not null default 'open' check (status in ('open','in_progress','completed','cancelled')),
  notes text not null default '' check (char_length(notes) <= 1000),
  due_date date,
  created_by_user_id uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  check ((status = 'completed' and completed_at is not null) or (status <> 'completed' and completed_at is null))
);

create index if not exists work_orders_company_status_due_idx
  on public.work_orders(company_id,status,due_date);

alter table public.work_orders enable row level security;
drop policy if exists "members read work orders" on public.work_orders;
create policy "members read work orders" on public.work_orders
for select to authenticated using (public.is_active_member(company_id));

revoke all on public.work_orders from anon,authenticated;
grant select on public.work_orders to authenticated;

create or replace function public.create_work_order(
  p_tool_id uuid,
  p_title text,
  p_due_date date,
  p_notes text default ''
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_tool public.tools;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_tool from public.tools where id = p_tool_id;
  if not found or not public.can_manage_company(v_tool.company_id) then raise exception 'Forbidden'; end if;
  if v_tool.status = 'retired'
    or char_length(trim(coalesce(p_title,''))) not between 2 and 160
    or char_length(coalesce(p_notes,'')) > 1000 then raise exception 'Invalid work order'; end if;

  insert into public.work_orders(company_id,tool_id,title,notes,due_date,created_by_user_id)
  values(v_tool.company_id,v_tool.id,trim(p_title),trim(coalesce(p_notes,'')),p_due_date,auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.create_work_order(uuid,text,date,text) from public,anon;
grant execute on function public.create_work_order(uuid,text,date,text) to authenticated;

create or replace function public.set_work_order_status(
  p_work_order_id uuid,
  p_status text
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_order public.work_orders;
begin
  if p_status not in ('open','in_progress','completed','cancelled') then raise exception 'Invalid status'; end if;
  select * into v_order from public.work_orders where id = p_work_order_id for update;
  if not found or not public.can_manage_company(v_order.company_id) then raise exception 'Forbidden'; end if;
  if v_order.status = p_status then return false; end if;

  update public.work_orders
  set status = p_status,
      completed_at = case when p_status = 'completed' then pg_catalog.now() else null end,
      updated_at = pg_catalog.now()
  where id = p_work_order_id;
  return true;
end;
$$;

revoke all on function public.set_work_order_status(uuid,text) from public,anon;
grant execute on function public.set_work_order_status(uuid,text) to authenticated;
