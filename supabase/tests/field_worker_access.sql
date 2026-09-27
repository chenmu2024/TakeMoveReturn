begin;

insert into auth.users(id) values ('66666666-6666-4666-8666-666666666666');
insert into public.companies(id,name,slug) values
  ('66666666-aaaa-4aaa-8aaa-666666666666','Field A','field-a'),
  ('77777777-bbbb-4bbb-8bbb-777777777777','Field B','field-b');
insert into public.organization_members(company_id,user_id,role) values
  ('66666666-aaaa-4aaa-8aaa-666666666666','66666666-6666-4666-8666-666666666666','owner');
insert into public.workers(id,company_id,name,pin_hash,pin_salt) values
  ('66666666-1111-4111-8111-666666666666','66666666-aaaa-4aaa-8aaa-666666666666','Field worker','hash','salt');
insert into public.locations(id,company_id,type,name) values
  ('66666666-2222-4222-8222-666666666666','66666666-aaaa-4aaa-8aaa-666666666666','warehouse','A warehouse'),
  ('77777777-2222-4222-8222-777777777777','77777777-bbbb-4bbb-8bbb-777777777777','warehouse','B warehouse');
insert into public.tools(id,company_id,asset_code,qr_token,name) values
  ('66666666-3333-4333-8333-666666666666','66666666-aaaa-4aaa-8aaa-666666666666','A-1',repeat('a',64),'A tool'),
  ('77777777-3333-4333-8333-777777777777','77777777-bbbb-4bbb-8bbb-777777777777','B-1',repeat('b',64),'B tool');

set local role anon;
do $$ begin
  begin
    perform public.begin_field_pin_attempt(repeat('d',64),'66666666-1111-4111-8111-666666666666',repeat('i',64));
    raise exception 'Anonymous PIN function access succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.record_field_tool_transaction(repeat('s',64),repeat('d',64),repeat('a',64),
      'checkout','66666666-2222-4222-8222-666666666666',null);
    raise exception 'Anonymous movement succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

set local role authenticated;
set local request.jwt.claim.sub = '66666666-6666-4666-8666-666666666666';
do $$ begin
  begin
    perform public.enroll_field_device('77777777-bbbb-4bbb-8bbb-777777777777',repeat('e',64));
    raise exception 'Cross-company device enrollment succeeded';
  exception when others then if SQLERRM <> 'Forbidden' then raise; end if;
  end;
  perform public.enroll_field_device('66666666-aaaa-4aaa-8aaa-666666666666',repeat('d',64));
end $$;

set local role service_role;
do $$
declare v_attempt uuid; v_success boolean; v_index integer;
begin
  select attempt_id into v_attempt from public.begin_field_pin_attempt(repeat('d',64),
    '66666666-1111-4111-8111-666666666666',repeat('i',64));
  if v_attempt is null then raise exception 'Valid device/worker was blocked'; end if;
  select public.complete_field_pin_attempt(v_attempt,true,repeat('s',64)) into v_success;
  if not v_success then raise exception 'Worker session not issued'; end if;
  perform public.record_field_tool_transaction(repeat('s',64),repeat('d',64),repeat('a',64),
    'checkout','66666666-2222-4222-8222-666666666666',null);
  if (select current_worker_id from public.tools where qr_token=repeat('a',64))
    <> '66666666-1111-4111-8111-666666666666' then raise exception 'TAKE not attributed'; end if;
  begin
    perform public.record_field_tool_transaction(repeat('s',64),repeat('d',64),repeat('b',64),
      'checkout','66666666-2222-4222-8222-666666666666',null);
    raise exception 'Cross-company QR movement succeeded';
  exception when others then if SQLERRM <> 'Tool not found' then raise; end if;
  end;
  begin
    perform public.record_field_tool_transaction(repeat('s',64),repeat('d',64),repeat('a',64),
      'return','77777777-2222-4222-8222-777777777777',null);
    raise exception 'Cross-company location accepted';
  exception when others then if SQLERRM <> 'Invalid location' then raise; end if;
  end;
  perform public.record_field_tool_transaction(repeat('s',64),repeat('d',64),repeat('a',64),
    'return','66666666-2222-4222-8222-666666666666',null);
  update public.workers set auth_version=auth_version+1 where id='66666666-1111-4111-8111-666666666666';
  begin
    perform public.record_field_tool_transaction(repeat('s',64),repeat('d',64),repeat('a',64),
      'checkout','66666666-2222-4222-8222-666666666666',null);
    raise exception 'Old session survived PIN reset';
  exception when others then if SQLERRM <> 'Session expired' then raise; end if;
  end;
  select attempt_id into v_attempt from public.begin_field_pin_attempt(repeat('d',64),
    '66666666-1111-4111-8111-666666666666',repeat('i',64));
  update public.workers set auth_version=auth_version+1 where id='66666666-1111-4111-8111-666666666666';
  if public.complete_field_pin_attempt(v_attempt,true,repeat('t',64)) then
    raise exception 'Reset race issued a session for an old PIN';
  end if;
  for v_index in 1..4 loop
    select attempt_id into v_attempt from public.begin_field_pin_attempt(repeat('d',64),
      '66666666-1111-4111-8111-666666666666',repeat('i',64));
    if v_attempt is null then raise exception 'Rate limit started too early'; end if;
    perform public.complete_field_pin_attempt(v_attempt,false,repeat('f',64));
  end loop;
  select attempt_id into v_attempt from public.begin_field_pin_attempt(repeat('d',64),
    '66666666-1111-4111-8111-666666666666',repeat('i',64));
  if v_attempt is not null then raise exception 'Worker PIN rate limit did not engage'; end if;
end $$;

rollback;
