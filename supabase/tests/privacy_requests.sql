begin;

insert into auth.users (id) values
  ('66666666-6666-4666-8666-666666666666'),
  ('77777777-7777-4777-8777-777777777777');
insert into public.companies (id, name, slug) values
  ('66666666-aaaa-4aaa-8aaa-666666666666', 'Privacy Tenant A', 'privacy-tenant-a'),
  ('77777777-bbbb-4bbb-8bbb-777777777777', 'Privacy Tenant B', 'privacy-tenant-b');
insert into public.organization_members (company_id, user_id, role) values
  ('66666666-aaaa-4aaa-8aaa-666666666666', '66666666-6666-4666-8666-666666666666', 'owner'),
  ('77777777-bbbb-4bbb-8bbb-777777777777', '77777777-7777-4777-8777-777777777777', 'owner');

set local role authenticated;
set local request.jwt.claim.sub = '66666666-6666-4666-8666-666666666666';

do $$
begin
  insert into public.privacy_requests (company_id, requester_user_id, request_type)
  values ('66666666-aaaa-4aaa-8aaa-666666666666', '66666666-6666-4666-8666-666666666666', 'export');
  if (select count(*) from public.privacy_requests) <> 1 then
    raise exception 'Own privacy request is not visible';
  end if;
  begin
    insert into public.privacy_requests (company_id, requester_user_id, request_type)
    values ('77777777-bbbb-4bbb-8bbb-777777777777', '66666666-6666-4666-8666-666666666666', 'deletion');
    raise exception 'Cross-company privacy request unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.privacy_requests (company_id, requester_user_id, request_type)
    values ('66666666-aaaa-4aaa-8aaa-666666666666', '77777777-7777-4777-8777-777777777777', 'access');
    raise exception 'Forged requester unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.privacy_requests (company_id, requester_user_id, request_type)
    values ('66666666-aaaa-4aaa-8aaa-666666666666', '66666666-6666-4666-8666-666666666666', 'export');
    raise exception 'Duplicate open request unexpectedly succeeded';
  exception when unique_violation then null;
  end;
  update public.privacy_requests set status = 'completed';
  if exists (select 1 from public.privacy_requests where status <> 'pending') then
    raise exception 'User unexpectedly changed request status';
  end if;
end;
$$;

set local request.jwt.claim.sub = '77777777-7777-4777-8777-777777777777';
do $$
begin
  if (select count(*) from public.privacy_requests) <> 0 then
    raise exception 'Another user could read a privacy request';
  end if;
end;
$$;

rollback;
