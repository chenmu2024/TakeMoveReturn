-- Run against the linked project with `npx supabase db query --linked --file supabase/tests/tenant_isolation.sql`.
-- Every fixture and transaction is rolled back, including on assertion failure.
begin;

insert into auth.users (id) values
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222');

insert into public.companies (id, name, slug) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Tenant Test A', 'tenant-test-a'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Tenant Test B', 'tenant-test-b');

insert into public.organization_members (company_id, user_id, role) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'owner');

insert into public.tools (id, company_id, asset_code, qr_token, name) values
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'TEST-A', 'tenant-test-a-token', 'Test tool A'),
  ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'TEST-B', 'tenant-test-b-token', 'Test tool B');

insert into public.locations (company_id, type, name)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'job_site', 'Tenant B site');

insert into public.workers (id, company_id, name, pin_hash, pin_salt)
values (
  'bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Tenant B worker',
  encode(decode(repeat('00', 32), 'hex'), 'base64'),
  encode(decode(repeat('00', 16), 'hex'), 'base64')
);

insert into public.workers (id, company_id, name, pin_hash, pin_salt)
values (
  'aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Tenant A session worker',
  encode(decode(repeat('00', 32), 'hex'), 'base64'),
  encode(decode(repeat('00', 16), 'hex'), 'base64')
);
insert into public.field_device_sessions (id, company_id, device_token_hash, expires_at)
values ('aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'tenant-test-a-device', now() + interval '1 day');
insert into public.worker_sessions (id, company_id, worker_id, device_session_id, worker_auth_version, idle_expires_at, absolute_expires_at)
values ('aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa', 'aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa', 1, now() + interval '15 minutes', now() + interval '8 hours');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

do $$
declare
  existing_company uuid;
  created_tool uuid;
  created_worker uuid;
  test_location uuid;
begin
  if auth.uid() <> '11111111-1111-4111-8111-111111111111'::uuid then
    raise exception 'Test identity was not applied';
  end if;
  if (select count(*) from public.companies) <> 1 then
    raise exception 'Company RLS isolation failed';
  end if;
  if (select count(*) from public.tools) <> 1 then
    raise exception 'Tool RLS isolation failed';
  end if;
  if (select count(*) from public.locations) <> 0 then
    raise exception 'Other company location was visible';
  end if;
  insert into public.locations (company_id, type, name)
  values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'warehouse', 'Test warehouse');
  select id into test_location from public.locations where company_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if (select count(*) from public.locations) <> 1 then
    raise exception 'Location RLS isolation failed';
  end if;
  begin
    insert into public.locations (company_id, type, name)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'truck', 'Cross-company truck');
    raise exception 'Cross-tenant location creation unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.workers) <> 1 then
    raise exception 'Worker RLS isolation failed';
  end if;
  begin
    perform public.create_worker(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Cross-company worker', null, null,
      encode(decode(repeat('00', 32), 'hex'), 'base64'),
      encode(decode(repeat('00', 16), 'hex'), 'base64')
    );
    raise exception 'Cross-tenant worker creation unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'Forbidden' then raise; end if;
  end;
  created_worker := public.create_worker(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Tenant A worker', null, 'CREW-1',
    encode(decode(repeat('00', 32), 'hex'), 'base64'),
    encode(decode(repeat('00', 16), 'hex'), 'base64')
  );
  if (select count(*) from public.workers where id = created_worker) <> 1 then
    raise exception 'Own-company worker was not visible';
  end if;
  if not public.is_valid_worker_session('aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then
    raise exception 'Worker session fixture was not valid';
  end if;
  begin
    perform public.reset_worker_pin(
      'bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb',
      encode(decode(repeat('11', 32), 'hex'), 'base64'),
      encode(decode(repeat('11', 16), 'hex'), 'base64'), true
    );
    raise exception 'Cross-tenant PIN reset unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'Forbidden' then raise; end if;
  end;
  perform public.reset_worker_pin(
    'aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa',
    encode(decode(repeat('11', 32), 'hex'), 'base64'),
    encode(decode(repeat('11', 16), 'hex'), 'base64'), false
  );
  if public.is_valid_worker_session('aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
     or (select revoked_at from public.worker_sessions where id = 'aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa') is null then
    raise exception 'Reset did not revoke the old worker session';
  end if;
  if not public.is_active_member('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
     or public.is_active_member('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') then
    raise exception 'Membership check crossed tenants';
  end if;
  if not public.can_manage_company('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
     or public.can_manage_company('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') then
    raise exception 'Management check crossed tenants';
  end if;

  existing_company := public.create_company('Duplicate onboarding attempt');
  if existing_company <> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid then
    raise exception 'Company onboarding was not idempotent';
  end if;

  begin
    perform public.create_tool('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'CROSS', 'Cross-company tool');
    raise exception 'Cross-tenant tool creation unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'Forbidden' then raise; end if;
  end;
  created_tool := public.create_tool('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'NEW-01', 'New test tool');
  if (select char_length(qr_token) from public.tools where id = created_tool) <> 64 then
    raise exception 'Tool QR token was not generated';
  end if;
  begin
    perform public.record_tool_transaction(created_tool, 'checkout'::public.transaction_type,
      'bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb', test_location);
    raise exception 'Cross-tenant worker checkout unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'Invalid worker' then raise; end if;
  end;
  perform public.record_tool_transaction(created_tool, 'checkout'::public.transaction_type, created_worker, test_location);
  perform public.record_tool_transaction(created_tool, 'transfer'::public.transaction_type, created_worker, test_location);
  perform public.record_tool_transaction(created_tool, 'return'::public.transaction_type, null, test_location);
  if (select status from public.tools where id = created_tool) <> 'available'
     or (select current_worker_id from public.tools where id = created_tool) is not null then
    raise exception 'TAKE/MOVE/RETURN did not close custody';
  end if;
  begin
    perform public.record_tool_transaction(created_tool, 'return'::public.transaction_type, null, test_location);
    raise exception 'Double return unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'Tool is not checked out' then raise; end if;
  end;
  for i in 1..23 loop
    perform public.create_tool('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'FILL-' || i, 'Capacity test tool');
  end loop;
  begin
    perform public.create_tool('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'OVER-LIMIT', 'Over limit tool');
    raise exception 'Tool capacity was not enforced';
  exception when others then
    if sqlerrm <> 'Tool limit reached' then raise; end if;
  end;

  begin
    perform public.record_tool_transaction(
      'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', 'transfer'::public.transaction_type
    );
    raise exception 'Cross-tenant movement unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'Forbidden' then raise; end if;
  end;

  perform public.record_tool_transaction(
    'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'transfer'::public.transaction_type
  );
  perform public.record_tool_transaction(
    'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'retire'::public.transaction_type
  );
  perform public.create_tool('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'AFTER-RETIRE', 'Replacement tool');
  if (select count(*) from public.tools where status <> 'retired') <> 25 then
    raise exception 'Retired tools did not free active capacity';
  end if;
  if (select count(*) from public.tool_transactions) <> 5 then
    raise exception 'Own-company transaction was not recorded';
  end if;
  if has_column_privilege('authenticated', 'public.workers', 'pin_hash', 'SELECT')
     or has_column_privilege('authenticated', 'public.workers', 'status', 'UPDATE')
     or has_table_privilege('authenticated', 'public.workers', 'DELETE')
     or has_column_privilege('authenticated', 'public.tools', 'current_worker_id', 'UPDATE')
     or has_table_privilege('authenticated', 'public.tool_transactions', 'INSERT') then
    raise exception 'Sensitive direct access is still granted';
  end if;
end;
$$;

select 'tenant_isolation_passed' as result;
rollback;
