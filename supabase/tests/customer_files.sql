begin;

insert into auth.users(id) values
  ('55555555-5555-4555-8555-555555555555'),
  ('66666666-6666-4666-8666-666666666666');

insert into public.companies(id,name,slug,plan) values
  ('55555555-aaaa-4aaa-8aaa-555555555555','Files A','files-a','free'),
  ('66666666-bbbb-4bbb-8bbb-666666666666','Files B','files-b','starter');

insert into public.organization_members(company_id,user_id,role) values
  ('55555555-aaaa-4aaa-8aaa-555555555555','55555555-5555-4555-8555-555555555555','owner'),
  ('66666666-bbbb-4bbb-8bbb-666666666666','66666666-6666-4666-8666-666666666666','owner');

insert into public.tools(id,company_id,asset_code,qr_token,name) values
  ('55555555-1111-4111-8111-555555555555','55555555-aaaa-4aaa-8aaa-555555555555','FILE-A',repeat('5',64),'Tenant A drill'),
  ('66666666-2222-4222-8222-666666666666','66666666-bbbb-4bbb-8bbb-666666666666','FILE-B',repeat('6',64),'Tenant B saw');

insert into public.damage_reports(id,company_id,tool_id,severity,description)
values (
  '55555555-3333-4333-8333-555555555555',
  '55555555-aaaa-4aaa-8aaa-555555555555',
  '55555555-1111-4111-8111-555555555555',
  'minor','Photo evidence test'
);

insert into public.maintenance_events(id,company_id,tool_id,service_name,cost_cents,serviced_at)
values (
  '55555555-4444-4444-8444-555555555555',
  '55555555-aaaa-4aaa-8aaa-555555555555',
  '55555555-1111-4111-8111-555555555555',
  'Inspection',0,current_date
);

do $$
begin
  if private.plan_storage_limit('free') <> 104857600::bigint
    or private.plan_storage_limit('starter') <> 2147483648::bigint
    or private.plan_storage_limit('growth') <> 10737418240::bigint
    or private.plan_storage_limit('pro') <> 26843545600::bigint then
    raise exception 'Storage limits do not match plan config';
  end if;
end $$;

set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-4555-8555-555555555555';

do $$
declare
  v_file uuid;
  v_key text;
  v_usage bigint;
begin
  select file_id, object_key into v_file, v_key
  from public.reserve_customer_file(
    'tool_photo',
    '55555555-1111-4111-8111-555555555555',
    'drill.jpg',
    'image/jpeg',
    1048576
  );

  if v_file is null or v_key not like '55555555-aaaa-4aaa-8aaa-555555555555/tool_photo/%' then
    raise exception 'Tool-photo reservation did not use company-scoped object key';
  end if;

  perform public.mark_customer_file_ready(v_file);

  if (select status from public.customer_files where id=v_file) <> 'ready' then
    raise exception 'Ready transition failed';
  end if;

  begin
    perform public.reserve_customer_file(
      'tool_photo',
      '55555555-1111-4111-8111-555555555555',
      'second.jpg',
      'image/jpeg',
      1024
    );
    raise exception 'Second tool photo exceeded the one-photo limit';
  exception when others then
    if SQLERRM <> 'Attachment limit reached' then raise; end if;
  end;

  begin
    perform public.reserve_customer_file(
      'tool_photo',
      '55555555-1111-4111-8111-555555555555',
      'too-large.jpg',
      'image/jpeg',
      5242881
    );
    raise exception 'Oversized tool photo was accepted';
  exception when others then
    if SQLERRM <> 'Image file size must not exceed 5 MB' then raise; end if;
  end;

  v_usage := public.customer_file_usage('55555555-aaaa-4aaa-8aaa-555555555555');
  if v_usage <> 1048576 then raise exception 'Usage did not include ready file'; end if;

  perform public.reserve_customer_file(
    'damage_photo',
    '55555555-3333-4333-8333-555555555555',
    'damage.webp',
    'image/webp',
    2048
  );
  perform public.reserve_customer_file(
    'damage_photo',
    '55555555-3333-4333-8333-555555555555',
    'damage-2.jpg',
    'image/jpeg',
    2048
  );
  perform public.reserve_customer_file(
    'damage_photo',
    '55555555-3333-4333-8333-555555555555',
    'damage-3.png',
    'image/png',
    2048
  );
  begin
    perform public.reserve_customer_file(
      'damage_photo',
      '55555555-3333-4333-8333-555555555555',
      'damage-4.jpg',
      'image/jpeg',
      2048
    );
    raise exception 'Fourth damage photo exceeded the three-photo limit';
  exception when others then
    if SQLERRM <> 'Attachment limit reached' then raise; end if;
  end;

  perform public.reserve_customer_file(
    'maintenance_attachment',
    '55555555-4444-4444-8444-555555555555',
    'inspection.pdf',
    'application/pdf',
    4096
  );

  begin
    perform public.reserve_customer_file(
      'tool_photo',
      '66666666-2222-4222-8222-666666666666',
      'other.jpg',
      'image/jpeg',
      1024
    );
    raise exception 'Cross-company file reservation succeeded';
  exception when others then
    if SQLERRM <> 'Tool not found' then raise; end if;
  end;

  begin
    perform public.reserve_customer_file(
      'tool_photo',
      '55555555-1111-4111-8111-555555555555',
      'manual.pdf',
      'application/pdf',
      1024
    );
    raise exception 'PDF tool photo was accepted';
  exception when others then
    if SQLERRM <> 'Only JPEG, PNG or WebP images are allowed' then raise; end if;
  end;

  begin
    perform public.reserve_customer_file(
      'maintenance_attachment',
      '55555555-4444-4444-8444-555555555555',
      '../unsafe.pdf',
      'application/pdf',
      1024
    );
    raise exception 'Unsafe file name was accepted';
  exception when others then
    if SQLERRM <> 'Invalid file name' then raise; end if;
  end;

  begin
    insert into public.customer_files(
      company_id,kind,tool_id,object_key,original_name,content_type,size_bytes,created_by_user_id
    ) values (
      '55555555-aaaa-4aaa-8aaa-555555555555','tool_photo',
      '55555555-1111-4111-8111-555555555555','direct/write','direct.jpg','image/jpeg',10,
      '55555555-5555-4555-8555-555555555555'
    );
    raise exception 'Direct file metadata write succeeded';
  exception when insufficient_privilege then null;
  end;

  if public.delete_customer_file(v_file) <> v_key then
    raise exception 'Delete did not return the reserved object key';
  end if;
  if (select status from public.customer_files where id=v_file) <> 'deleted' then
    raise exception 'Delete did not tombstone metadata';
  end if;
end $$;

set local request.jwt.claim.sub = '66666666-6666-4666-8666-666666666666';

do $$
begin
  if (select count(*) from public.customer_files) <> 0 then
    raise exception 'Cross-company ready files were visible';
  end if;
  begin
    perform public.customer_file_usage('55555555-aaaa-4aaa-8aaa-555555555555');
    raise exception 'Cross-company usage was visible';
  exception when others then
    if SQLERRM <> 'Workspace access required' then raise; end if;
  end;
end $$;

rollback;
