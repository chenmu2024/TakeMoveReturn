begin;

insert into auth.users(id) values
  ('d1111111-1111-4111-8111-111111111111'),
  ('d2222222-2222-4222-8222-222222222222');

insert into public.profiles(id,display_name) values
  ('d1111111-1111-4111-8111-111111111111','Privacy User'),
  ('d2222222-2222-4222-8222-222222222222','Remaining Owner');

insert into public.companies(id,name,slug) values
  ('d1111111-aaaa-4aaa-8aaa-111111111111','Privacy Co','privacy-finish');

insert into public.organization_members(company_id,user_id,role,status) values
  ('d1111111-aaaa-4aaa-8aaa-111111111111','d1111111-1111-4111-8111-111111111111','owner','active'),
  ('d1111111-aaaa-4aaa-8aaa-111111111111','d2222222-2222-4222-8222-222222222222','owner','active');

insert into public.privacy_requests(
  id,company_id,requester_user_id,request_type,details,status,created_at
) values (
  'd1111111-3000-4000-8000-111111111111',
  'd1111111-aaaa-4aaa-8aaa-111111111111',
  'd1111111-1111-4111-8111-111111111111',
  'deletion','Close my account','pending',now()
);

set local role service_role;

do $$
begin
  if not public.fulfill_account_deletion('d1111111-1111-4111-8111-111111111111') then
    raise exception 'Account deletion fulfilment returned false';
  end if;

  if (select display_name from public.profiles where id='d1111111-1111-4111-8111-111111111111') <> 'Deleted User' then
    raise exception 'Profile was not pseudonymized';
  end if;

  if (select status from public.organization_members
      where company_id='d1111111-aaaa-4aaa-8aaa-111111111111'
        and user_id='d1111111-1111-4111-8111-111111111111') <> 'inactive' then
    raise exception 'Membership was not deactivated';
  end if;

  if (select status from public.privacy_requests where id='d1111111-3000-4000-8000-111111111111') <> 'completed' then
    raise exception 'Deletion request was not completed';
  end if;
end $$;

insert into public.privacy_requests(
  id,company_id,requester_user_id,request_type,details,status,created_at,completed_at
) values (
  'd1111111-4000-4000-8000-111111111111',
  'd1111111-aaaa-4aaa-8aaa-111111111111',
  'd2222222-2222-4222-8222-222222222222',
  'access','Old completed request','completed',
  now() - interval '26 months',now() - interval '25 months'
);

do $$
declare
  v_result jsonb;
begin
  v_result := public.run_retention_cleanup();
  if exists(select 1 from public.privacy_requests where id='d1111111-4000-4000-8000-111111111111') then
    raise exception 'Expired completed privacy request was not cleaned up';
  end if;
  if coalesce((v_result->>'privacy_requests')::integer,0) < 1 then
    raise exception 'Retention result did not report privacy cleanup';
  end if;
end $$;

rollback;
