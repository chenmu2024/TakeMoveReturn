begin;

insert into auth.users(id) values
  ('88888888-8888-4888-8888-888888888888'),
  ('99999999-9999-4999-8999-999999999999');
insert into public.companies(id, name, slug) values
  ('88888888-aaaa-4aaa-8aaa-888888888888', 'Service Tenant A', 'service-tenant-a'),
  ('99999999-bbbb-4bbb-8bbb-999999999999', 'Service Tenant B', 'service-tenant-b');
insert into public.organization_members(company_id, user_id, role) values
  ('88888888-aaaa-4aaa-8aaa-888888888888', '88888888-8888-4888-8888-888888888888', 'owner'),
  ('99999999-bbbb-4bbb-8bbb-999999999999', '99999999-9999-4999-8999-999999999999', 'owner');
insert into public.tools(id, company_id, asset_code, qr_token, name) values
  ('88888888-1111-4111-8111-888888888888', '88888888-aaaa-4aaa-8aaa-888888888888', 'SRV-A', repeat('8', 64), 'Tenant A drill'),
  ('99999999-2222-4222-8222-999999999999', '99999999-bbbb-4bbb-8bbb-999999999999', 'SRV-B', repeat('9', 64), 'Tenant B saw');

set local role authenticated;
set local request.jwt.claim.sub = '88888888-8888-4888-8888-888888888888';
do $$
declare report_id uuid; v_schedule_id uuid;
begin
  begin
    perform public.report_tool_damage('99999999-2222-4222-8222-999999999999', 'minor', 'Other company');
    raise exception 'Cross-company damage report succeeded';
  exception when others then
    if SQLERRM <> 'Forbidden' then raise; end if;
  end;
  report_id := public.report_tool_damage('88888888-1111-4111-8111-888888888888', 'needs_repair', 'Cracked casing');
  if (select status from public.tools where id = '88888888-1111-4111-8111-888888888888') <> 'damaged' then
    raise exception 'Damage did not update tool status';
  end if;
  begin
    perform public.report_tool_damage('88888888-1111-4111-8111-888888888888', 'minor', 'Duplicate issue');
    raise exception 'Duplicate open report succeeded';
  exception when others then
    if SQLERRM <> 'Open report exists' then raise; end if;
  end;
  perform public.resolve_tool_damage(report_id, 'Casing replaced');
  if (select status from public.tools where id = '88888888-1111-4111-8111-888888888888') <> 'available' then
    raise exception 'Resolution did not restore status';
  end if;
  if (select count(*) from public.tool_transactions where tool_id = '88888888-1111-4111-8111-888888888888') <> 2 then
    raise exception 'Damage and repair were not audited';
  end if;
  begin
    insert into public.damage_reports(company_id, tool_id, reported_by_user_id, severity, description)
    values ('88888888-aaaa-4aaa-8aaa-888888888888', '88888888-1111-4111-8111-888888888888',
      '88888888-8888-4888-8888-888888888888', 'minor', 'Direct write');
    raise exception 'Direct damage write succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.schedule_tool_service('99999999-2222-4222-8222-999999999999', 'Inspection', 90, current_date);
    raise exception 'Cross-company schedule succeeded';
  exception when others then
    if SQLERRM <> 'Forbidden' then raise; end if;
  end;
  v_schedule_id := public.schedule_tool_service('88888888-1111-4111-8111-888888888888', 'Inspection', 90, current_date);
  perform public.record_tool_service(v_schedule_id, current_date, 2500, 'Checked and cleaned');
  if (select next_due_at from public.maintenance_schedules where id = v_schedule_id) <> current_date + 90 then
    raise exception 'Next service date was not advanced';
  end if;
  if (select count(*) from public.maintenance_events where schedule_id = v_schedule_id) <> 1 then
    raise exception 'Service event was not recorded';
  end if;
  if (select count(*) from public.tool_transactions where tool_id = '88888888-1111-4111-8111-888888888888') <> 3 then
    raise exception 'Service event was not added to tool history';
  end if;
end;
$$;

set local request.jwt.claim.sub = '99999999-9999-4999-8999-999999999999';
do $$
begin
  if (select count(*) from public.damage_reports) <> 0 or
     (select count(*) from public.maintenance_schedules) <> 0 or
     (select count(*) from public.maintenance_events) <> 0 then
    raise exception 'Cross-company records were visible';
  end if;
end;
$$;

rollback;
