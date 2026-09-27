create table public.damage_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  reported_by_user_id uuid references auth.users(id) on delete set null,
  severity text not null check (severity in ('minor', 'needs_repair', 'unusable', 'lost')),
  description text not null check (char_length(description) between 3 and 1000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_user_id uuid references auth.users(id) on delete set null,
  check ((status = 'open' and resolved_at is null) or (status = 'resolved' and resolved_at is not null))
);
create unique index one_open_damage_per_tool on public.damage_reports(tool_id) where status = 'open';
create index damage_reports_company_created on public.damage_reports(company_id, created_at desc);

create table public.maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  service_name text not null check (char_length(service_name) between 2 and 120),
  interval_days integer not null check (interval_days between 1 and 3650),
  next_due_at date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tool_id, service_name)
);
create index maintenance_schedules_company_due on public.maintenance_schedules(company_id, next_due_at) where active;

create table public.maintenance_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  schedule_id uuid references public.maintenance_schedules(id) on delete set null,
  performed_by_user_id uuid references auth.users(id) on delete set null,
  service_name text not null check (char_length(service_name) between 2 and 120),
  notes text check (char_length(notes) <= 1000),
  cost_cents integer not null default 0 check (cost_cents between 0 and 100000000),
  serviced_at date not null,
  created_at timestamptz not null default now()
);
create index maintenance_events_company_created on public.maintenance_events(company_id, created_at desc);

alter table public.damage_reports enable row level security;
alter table public.maintenance_schedules enable row level security;
alter table public.maintenance_events enable row level security;
create policy "members read damage" on public.damage_reports for select using (public.is_active_member(company_id));
create policy "members read schedules" on public.maintenance_schedules for select using (public.is_active_member(company_id));
create policy "members read service history" on public.maintenance_events for select using (public.is_active_member(company_id));
revoke insert, update, delete on public.damage_reports, public.maintenance_schedules, public.maintenance_events from anon, authenticated;

create function private.report_tool_damage(p_tool_id uuid, p_severity text, p_description text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  target_tool public.tools;
  report_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into target_tool from public.tools where id = p_tool_id for update;
  if not found then raise exception 'Tool not found'; end if;
  if not private.can_manage_company(target_tool.company_id) then raise exception 'Forbidden'; end if;
  if target_tool.status = 'retired' then raise exception 'Retired tool'; end if;
  if p_severity not in ('minor', 'needs_repair', 'unusable', 'lost')
     or char_length(trim(coalesce(p_description, ''))) not between 3 and 1000 then
    raise exception 'Invalid report';
  end if;
  if exists (select 1 from public.damage_reports where tool_id = p_tool_id and status = 'open') then
    raise exception 'Open report exists';
  end if;
  insert into public.damage_reports(company_id, tool_id, reported_by_user_id, severity, description)
  values (target_tool.company_id, p_tool_id, auth.uid(), p_severity, trim(p_description)) returning id into report_id;
  update public.tools set status = case when p_severity = 'lost' then 'missing'::public.tool_status else 'damaged'::public.tool_status end,
    condition = case when p_severity = 'unusable' then 'unusable' else condition end,
    revision = revision + 1, updated_at = now() where id = p_tool_id;
  insert into public.tool_transactions(company_id, tool_id, transaction_type, from_worker_id, to_worker_id,
    from_location_id, to_location_id, performed_by_user_id, notes)
  values (target_tool.company_id, p_tool_id, case when p_severity = 'lost' then 'missing'::public.transaction_type else 'damage'::public.transaction_type end,
    target_tool.current_worker_id, target_tool.current_worker_id, target_tool.current_location_id, target_tool.current_location_id,
    auth.uid(), trim(p_description));
  return report_id;
end;
$$;
revoke all on function private.report_tool_damage(uuid, text, text) from public;
grant execute on function private.report_tool_damage(uuid, text, text) to authenticated;
create function public.report_tool_damage(p_tool_id uuid, p_severity text, p_description text)
returns uuid language sql security invoker set search_path = '' as $$
  select private.report_tool_damage(p_tool_id, p_severity, p_description);
$$;
revoke all on function public.report_tool_damage(uuid, text, text) from public, anon;
grant execute on function public.report_tool_damage(uuid, text, text) to authenticated;

create function private.resolve_tool_damage(p_report_id uuid, p_resolution text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  target_report public.damage_reports;
  target_tool public.tools;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into target_report from public.damage_reports where id = p_report_id for update;
  if not found then raise exception 'Report not found'; end if;
  if not private.can_manage_company(target_report.company_id) then raise exception 'Forbidden'; end if;
  select * into target_tool from public.tools where id = target_report.tool_id for update;
  if target_report.status <> 'open' or target_tool.status not in ('damaged', 'missing') then raise exception 'Report state changed'; end if;
  if char_length(trim(coalesce(p_resolution, ''))) not between 3 and 1000 then raise exception 'Invalid resolution'; end if;
  update public.damage_reports set status = 'resolved', resolved_at = now(), resolved_by_user_id = auth.uid()
    where id = p_report_id;
  update public.tools set status = case when current_worker_id is null then 'available'::public.tool_status else 'checked_out'::public.tool_status end,
    condition = case when condition = 'unusable' then 'fair' else condition end,
    revision = revision + 1, updated_at = now() where id = target_tool.id;
  insert into public.tool_transactions(company_id, tool_id, transaction_type, from_worker_id, to_worker_id,
    from_location_id, to_location_id, performed_by_user_id, notes)
  values (target_report.company_id, target_tool.id,
    case when target_report.severity = 'lost' then 'found'::public.transaction_type else 'repair'::public.transaction_type end,
    target_tool.current_worker_id, target_tool.current_worker_id, target_tool.current_location_id, target_tool.current_location_id,
    auth.uid(), trim(p_resolution));
  return target_tool.id;
end;
$$;
revoke all on function private.resolve_tool_damage(uuid, text) from public;
grant execute on function private.resolve_tool_damage(uuid, text) to authenticated;
create function public.resolve_tool_damage(p_report_id uuid, p_resolution text)
returns uuid language sql security invoker set search_path = '' as $$
  select private.resolve_tool_damage(p_report_id, p_resolution);
$$;
revoke all on function public.resolve_tool_damage(uuid, text) from public, anon;
grant execute on function public.resolve_tool_damage(uuid, text) to authenticated;

create function private.schedule_tool_service(p_tool_id uuid, p_service_name text, p_interval_days integer, p_next_due_at date)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target_tool public.tools; schedule_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into target_tool from public.tools where id = p_tool_id for update;
  if not found then raise exception 'Tool not found'; end if;
  if not private.can_manage_company(target_tool.company_id) then raise exception 'Forbidden'; end if;
  if target_tool.status = 'retired' or char_length(trim(coalesce(p_service_name, ''))) not between 2 and 120
     or p_interval_days not between 1 and 3650 or p_next_due_at is null then raise exception 'Invalid schedule'; end if;
  insert into public.maintenance_schedules(company_id, tool_id, service_name, interval_days, next_due_at)
  values (target_tool.company_id, p_tool_id, trim(p_service_name), p_interval_days, p_next_due_at)
  returning id into schedule_id;
  return schedule_id;
end;
$$;
revoke all on function private.schedule_tool_service(uuid, text, integer, date) from public;
grant execute on function private.schedule_tool_service(uuid, text, integer, date) to authenticated;
create function public.schedule_tool_service(p_tool_id uuid, p_service_name text, p_interval_days integer, p_next_due_at date)
returns uuid language sql security invoker set search_path = '' as $$
  select private.schedule_tool_service(p_tool_id, p_service_name, p_interval_days, p_next_due_at);
$$;
revoke all on function public.schedule_tool_service(uuid, text, integer, date) from public, anon;
grant execute on function public.schedule_tool_service(uuid, text, integer, date) to authenticated;

create function private.record_tool_service(p_schedule_id uuid, p_serviced_at date, p_cost_cents integer, p_notes text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target_schedule public.maintenance_schedules; target_tool public.tools; event_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into target_schedule from public.maintenance_schedules where id = p_schedule_id for update;
  if not found then raise exception 'Schedule not found'; end if;
  if not private.can_manage_company(target_schedule.company_id) then raise exception 'Forbidden'; end if;
  select * into target_tool from public.tools where id = target_schedule.tool_id for update;
  if not found or target_tool.status = 'retired' then raise exception 'Tool unavailable'; end if;
  if not target_schedule.active or p_serviced_at is null or p_serviced_at > current_date
     or p_cost_cents not between 0 and 100000000 or char_length(coalesce(p_notes, '')) > 1000 then raise exception 'Invalid service'; end if;
  insert into public.maintenance_events(company_id, tool_id, schedule_id, performed_by_user_id, service_name, notes, cost_cents, serviced_at)
  values (target_schedule.company_id, target_schedule.tool_id, target_schedule.id, auth.uid(), target_schedule.service_name,
    nullif(trim(p_notes), ''), p_cost_cents, p_serviced_at) returning id into event_id;
  update public.maintenance_schedules set next_due_at = p_serviced_at + interval_days, updated_at = now() where id = target_schedule.id;
  insert into public.tool_transactions(company_id, tool_id, transaction_type, performed_by_user_id, notes)
  values (target_schedule.company_id, target_schedule.tool_id, 'maintenance', auth.uid(), target_schedule.service_name);
  return event_id;
end;
$$;
revoke all on function private.record_tool_service(uuid, date, integer, text) from public;
grant execute on function private.record_tool_service(uuid, date, integer, text) to authenticated;
create function public.record_tool_service(p_schedule_id uuid, p_serviced_at date, p_cost_cents integer, p_notes text)
returns uuid language sql security invoker set search_path = '' as $$
  select private.record_tool_service(p_schedule_id, p_serviced_at, p_cost_cents, p_notes);
$$;
revoke all on function public.record_tool_service(uuid, date, integer, text) from public, anon;
grant execute on function public.record_tool_service(uuid, date, integer, text) to authenticated;
