begin;

insert into auth.users(id) values ('77777777-7777-4777-8777-777777777777');

insert into public.companies(id,name,slug,plan)
values ('77777777-aaaa-4aaa-8aaa-777777777777','Cleanup Co','cleanup-co','free');

insert into public.organization_members(company_id,user_id,role)
values ('77777777-aaaa-4aaa-8aaa-777777777777','77777777-7777-4777-8777-777777777777','owner');

insert into public.tools(id,company_id,asset_code,qr_token,name)
values ('77777777-1111-4111-8111-777777777777','77777777-aaaa-4aaa-8aaa-777777777777','CLEAN-1',repeat('7',64),'Cleanup drill');

insert into public.customer_files(
  id,company_id,kind,tool_id,object_key,original_name,content_type,size_bytes,status,
  created_by_user_id,created_at
) values (
  '77777777-2222-4222-8222-777777777777',
  '77777777-aaaa-4aaa-8aaa-777777777777',
  'tool_photo',
  '77777777-1111-4111-8111-777777777777',
  '77777777-aaaa-4aaa-8aaa-777777777777/tool_photo/stale',
  'stale.jpg','image/jpeg',1024,'pending',
  '77777777-7777-4777-8777-777777777777',
  now() - interval '2 hours'
), (
  '77777777-3333-4333-8333-777777777777',
  '77777777-aaaa-4aaa-8aaa-777777777777',
  'tool_photo',
  '77777777-1111-4111-8111-777777777777',
  '77777777-aaaa-4aaa-8aaa-777777777777/tool_photo/live',
  'live.jpg','image/jpeg',1024,'ready',
  '77777777-7777-4777-8777-777777777777',
  now()
);

update public.customer_files
set ready_at = now()
where id = '77777777-3333-4333-8333-777777777777';

do $$
begin
  begin
    delete from public.tools where id = '77777777-1111-4111-8111-777777777777';
    raise exception 'Parent delete guard did not block a live file';
  exception when others then
    if SQLERRM <> 'Customer file objects must be deleted before deleting this record' then raise; end if;
  end;
end $$;

set local role service_role;

do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.customer_file_cleanup_batch(100);
  if v_count <> 1 then raise exception 'Expected one stale pending object in cleanup batch, got %', v_count; end if;

  if (select status from public.customer_files where id='77777777-2222-4222-8222-777777777777') <> 'deleted' then
    raise exception 'Stale pending file was not tombstoned';
  end if;

  if (select r2_delete_attempts from public.customer_files where id='77777777-2222-4222-8222-777777777777') <> 1 then
    raise exception 'Cleanup attempt was not recorded';
  end if;

  perform public.record_customer_file_object_cleanup(
    '77777777-2222-4222-8222-777777777777',
    true,
    null
  );

  if (select object_deleted_at is null from public.customer_files where id='77777777-2222-4222-8222-777777777777') then
    raise exception 'Successful object cleanup was not recorded';
  end if;
end $$;

reset role;

update public.customer_files
set status='deleted', deleted_at=now(), object_deleted_at=now()
where id='77777777-3333-4333-8333-777777777777';

delete from public.tools where id = '77777777-1111-4111-8111-777777777777';

do $$
begin
  if exists(select 1 from public.tools where id='77777777-1111-4111-8111-777777777777') then
    raise exception 'Parent delete remained blocked after all objects were recorded deleted';
  end if;
end $$;

rollback;
