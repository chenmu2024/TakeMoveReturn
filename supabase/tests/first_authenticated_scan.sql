begin;

insert into auth.users(id) values ('b1111111-1111-4111-8111-111111111111');
insert into public.companies(id,name,slug) values
  ('b1111111-aaaa-4aaa-8aaa-111111111111','Scan A','scan-a'),
  ('b2222222-bbbb-4bbb-8bbb-222222222222','Scan B','scan-b');
insert into public.organization_members(company_id,user_id,role) values
  ('b1111111-aaaa-4aaa-8aaa-111111111111','b1111111-1111-4111-8111-111111111111','manager');
insert into public.workers(id,company_id,name,pin_hash,pin_salt) values
  ('b1111111-1000-4000-8000-111111111111','b1111111-aaaa-4aaa-8aaa-111111111111','Scanner','hash','salt');
insert into public.tools(id,company_id,asset_code,qr_token,name) values
  ('b1111111-2000-4000-8000-111111111111','b1111111-aaaa-4aaa-8aaa-111111111111','S-A',repeat('a',64),'Scan A tool'),
  ('b2222222-2000-4000-8000-222222222222','b2222222-bbbb-4bbb-8bbb-222222222222','S-B',repeat('b',64),'Scan B tool');
insert into public.field_device_sessions(id,company_id,device_token_hash,expires_at) values
  ('b1111111-3000-4000-8000-111111111111','b1111111-aaaa-4aaa-8aaa-111111111111',repeat('d',64),now()+interval '1 day');
insert into public.worker_sessions(id,company_id,worker_id,device_session_id,worker_auth_version,
  idle_expires_at,absolute_expires_at,session_token_hash) values
  ('b1111111-4000-4000-8000-111111111111','b1111111-aaaa-4aaa-8aaa-111111111111',
  'b1111111-1000-4000-8000-111111111111','b1111111-3000-4000-8000-111111111111',1,
  now()+interval '10 minutes',now()+interval '1 hour',repeat('s',64));

set local role anon;
do $$ begin
  begin
    perform public.record_first_authenticated_scan(repeat('s',64),repeat('d',64),repeat('a',64));
    raise exception 'Anonymous scan write succeeded';
  exception when insufficient_privilege then null; end;
  begin
    perform count(*) from public.first_authenticated_scans;
    raise exception 'Anonymous scan read succeeded';
  exception when insufficient_privilege then null; end;
end $$;

set local role service_role;
do $$ begin
  if public.record_first_authenticated_scan(repeat('s',64),repeat('d',64),repeat('b',64))
    then raise exception 'Cross-company QR counted'; end if;
  if public.record_first_authenticated_scan(repeat('s',64),repeat('x',64),repeat('a',64))
    then raise exception 'Wrong device counted'; end if;
  if not public.record_first_authenticated_scan(repeat('s',64),repeat('d',64),repeat('a',64))
    then raise exception 'Valid scan rejected'; end if;
  perform public.record_first_authenticated_scan(repeat('s',64),repeat('d',64),repeat('a',64));
  if (select count(*) from public.first_authenticated_scans) <> 1 then
    raise exception 'First scan was not idempotent'; end if;
end $$;

set local role authenticated;
set local request.jwt.claim.sub = 'b1111111-1111-4111-8111-111111111111';
do $$ begin
  if (select count(*) from public.first_authenticated_scans) <> 1 then
    raise exception 'Manager cannot read own first scan'; end if;
  begin
    perform public.record_first_authenticated_scan(repeat('s',64),repeat('d',64),repeat('a',64));
    raise exception 'Authenticated member wrote scan';
  exception when insufficient_privilege then null; end;
end $$;

rollback;
