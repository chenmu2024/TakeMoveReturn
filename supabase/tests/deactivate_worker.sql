begin;

insert into auth.users(id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.companies(id,name,slug) values
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','Worker A','worker-a'),
  ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb','Worker B','worker-b');
insert into public.organization_members(company_id,user_id,role) values
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','owner');
insert into public.workers(id,company_id,name,pin_hash,pin_salt) values
  ('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','A worker','hash','salt'),
  ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb','bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb','B worker','hash','salt');
insert into public.field_device_sessions(id,company_id,device_token_hash,expires_at) values
  ('aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa','aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',repeat('d',64),now()+interval '30 days');
insert into public.worker_sessions(id,company_id,worker_id,device_session_id,worker_auth_version,
  idle_expires_at,absolute_expires_at,session_token_hash) values
  ('aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa','aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
  'aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa',1,
  now()+interval '15 minutes',now()+interval '8 hours',repeat('s',64));

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$ begin
  begin
    perform public.deactivate_worker('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb');
    raise exception 'Cross-company worker deactivation succeeded';
  exception when others then if SQLERRM <> 'Forbidden' then raise; end if;
  end;
  if not public.deactivate_worker('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa') then
    raise exception 'Own worker deactivation failed';
  end if;
end $$;

reset role;
do $$ begin
  if (select status from public.workers where id='aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa') <> 'inactive'
    or (select auth_version from public.workers where id='aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa') <> 2
    or (select revoked_at from public.worker_sessions where id='aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa') is null
    then raise exception 'Deactivation did not invalidate worker sessions'; end if;
  if (select status from public.workers where id='bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb') <> 'active'
    then raise exception 'Other-company worker changed'; end if;
end $$;

rollback;
