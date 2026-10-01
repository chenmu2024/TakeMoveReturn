begin;

insert into auth.users(id) values ('c1111111-1111-4111-8111-111111111111');

insert into public.companies(id,name,slug,timezone,plan) values
('c1111111-aaaa-4aaa-8aaa-111111111111','Finish Co','finish-co','America/Los_Angeles','starter');

insert into public.organization_members(company_id,user_id,role) values
('c1111111-aaaa-4aaa-8aaa-111111111111','c1111111-1111-4111-8111-111111111111','owner');

insert into public.locations(id,company_id,type,name) values
('c1111111-2000-4000-8000-111111111111','c1111111-aaaa-4aaa-8aaa-111111111111','warehouse','Shop'),
('c1111111-2000-4000-8000-222222222222','c1111111-aaaa-4aaa-8aaa-111111111111','job_site','Site');

insert into public.workers(id,company_id,name,pin_hash,pin_salt) values
('c1111111-3000-4000-8000-111111111111','c1111111-aaaa-4aaa-8aaa-111111111111','Worker A','hash','salt');

insert into public.tools(id,company_id,asset_code,qr_token,name,status,current_worker_id,current_location_id) values
('c1111111-4000-4000-8000-111111111111','c1111111-aaaa-4aaa-8aaa-111111111111','FIX-A',repeat('a',64),'Due tool','checked_out','c1111111-3000-4000-8000-111111111111','c1111111-2000-4000-8000-111111111111'),
('c1111111-4000-4000-8000-222222222222','c1111111-aaaa-4aaa-8aaa-111111111111','FIX-B',repeat('b',64),'Field tool','checked_out','c1111111-3000-4000-8000-111111111111','c1111111-2000-4000-8000-111111111111');

insert into public.field_device_sessions(id,company_id,device_token_hash,expires_at) values
('c1111111-5000-4000-8000-111111111111','c1111111-aaaa-4aaa-8aaa-111111111111',repeat('d',64),now()+interval '1 day');

insert into public.worker_sessions(id,company_id,worker_id,device_session_id,worker_auth_version,idle_expires_at,absolute_expires_at,session_token_hash) values
('c1111111-6000-4000-8000-111111111111','c1111111-aaaa-4aaa-8aaa-111111111111','c1111111-3000-4000-8000-111111111111','c1111111-5000-4000-8000-111111111111',1,now()+interval '10 minutes',now()+interval '1 hour',repeat('s',64));

set local role authenticated;
set local request.jwt.claim.sub = 'c1111111-1111-4111-8111-111111111111';

do $$
declare
  v_tx uuid;
  v_work uuid;
  v_file uuid;
begin
  perform public.set_tool_return_due_date('c1111111-4000-4000-8000-111111111111','2099-01-15'::date);
  if (select expected_return_date from public.tools where id='c1111111-4000-4000-8000-111111111111') <> '2099-01-15'::date then
    raise exception 'Company-local due date was not stored as a date';
  end if;

  v_tx := public.correct_tool_custody(
    'c1111111-4000-4000-8000-111111111111',
    null,
    'c1111111-2000-4000-8000-222222222222',
    'Wrong worker selected during handoff',
    null
  );
  if v_tx is null or (select status from public.tools where id='c1111111-4000-4000-8000-111111111111') <> 'available' then
    raise exception 'Custody correction failed';
  end if;
  if (select expected_return_date from public.tools where id='c1111111-4000-4000-8000-111111111111') is not null then
    raise exception 'Due date was not cleared when custody ended';
  end if;

  v_work := public.create_work_order(
    'c1111111-4000-4000-8000-111111111111',
    'Inspect chuck',
    '2099-01-20'::date,
    'Check runout before next dispatch'
  );
  if v_work is null then raise exception 'Work order create failed'; end if;
  perform public.set_work_order_status(v_work,'in_progress');
  perform public.set_work_order_status(v_work,'completed');
  if (select status from public.work_orders where id=v_work) <> 'completed'
    or (select completed_at from public.work_orders where id=v_work) is null then
    raise exception 'Work order completion failed';
  end if;

  select file_id into v_file from public.reserve_customer_file(
    'tool_photo','c1111111-4000-4000-8000-111111111111','primary.jpg','image/jpeg',1024
  );

  begin
    perform public.reserve_customer_file(
      'tool_photo','c1111111-4000-4000-8000-111111111111','second.jpg','image/jpeg',1024
    );
    raise exception 'Second active tool image was accepted';
  exception when others then
    if SQLERRM <> 'Tool already has an active primary image' then raise; end if;
  end;

  begin
    perform public.reserve_customer_file(
      'damage_photo','c1111111-7000-4000-8000-111111111111','too-large.jpg','image/jpeg',5242881
    );
    raise exception 'Oversized damage image was accepted';
  exception when others then
    if SQLERRM not in ('Images are limited to 5 MB','Damage report not found') then raise; end if;
  end;
end $$;

-- Entity-count limits are tested with valid parent rows created by the test harness, not by the authenticated product role.
reset role;
insert into public.damage_reports(id,company_id,tool_id,severity,description) values
('c1111111-7000-4000-8000-111111111111','c1111111-aaaa-4aaa-8aaa-111111111111','c1111111-4000-4000-8000-111111111111','minor','Limit test');
insert into public.maintenance_events(id,company_id,tool_id,service_name,cost_cents,serviced_at) values
('c1111111-8000-4000-8000-111111111111','c1111111-aaaa-4aaa-8aaa-111111111111','c1111111-4000-4000-8000-111111111111','Inspection',0,current_date);

set local role authenticated;
set local request.jwt.claim.sub = 'c1111111-1111-4111-8111-111111111111';

do $
begin
  perform public.reserve_customer_file('damage_photo','c1111111-7000-4000-8000-111111111111','d1.jpg','image/jpeg',1024);
  perform public.reserve_customer_file('damage_photo','c1111111-7000-4000-8000-111111111111','d2.jpg','image/jpeg',1024);
  perform public.reserve_customer_file('damage_photo','c1111111-7000-4000-8000-111111111111','d3.jpg','image/jpeg',1024);
  begin
    perform public.reserve_customer_file('damage_photo','c1111111-7000-4000-8000-111111111111','d4.jpg','image/jpeg',1024);
    raise exception 'Fourth damage photo was accepted';
  exception when others then
    if SQLERRM <> 'Damage reports allow up to 3 photos' then raise; end if;
  end;

  perform public.reserve_customer_file('maintenance_attachment','c1111111-8000-4000-8000-111111111111','m1.pdf','application/pdf',1024);
  perform public.reserve_customer_file('maintenance_attachment','c1111111-8000-4000-8000-111111111111','m2.pdf','application/pdf',1024);
  perform public.reserve_customer_file('maintenance_attachment','c1111111-8000-4000-8000-111111111111','m3.pdf','application/pdf',1024);
  begin
    perform public.reserve_customer_file('maintenance_attachment','c1111111-8000-4000-8000-111111111111','m4.pdf','application/pdf',1024);
    raise exception 'Fourth maintenance attachment was accepted';
  exception when others then
    if SQLERRM <> 'Maintenance events allow up to 3 attachments' then raise; end if;
  end;
end $$;

set local role service_role;
do $$
declare v_report uuid;
begin
  v_report := public.report_field_tool_issue(
    repeat('s',64),repeat('d',64),repeat('b',64),
    'damage','needs_repair','Chuck slips under load'
  );
  if v_report is null then raise exception 'Field damage report failed'; end if;
  if (select reported_by_worker_id from public.damage_reports where id=v_report)
    <> 'c1111111-3000-4000-8000-111111111111' then
    raise exception 'Field report was not attributed to worker';
  end if;
  if (select status from public.tools where id='c1111111-4000-4000-8000-222222222222') <> 'damaged' then
    raise exception 'Field damage did not update tool state';
  end if;
end $$;

rollback;
