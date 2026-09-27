begin;

insert into auth.users(id) values
  ('cccccccc-1111-4111-8111-cccccccccccc'),
  ('dddddddd-1111-4111-8111-dddddddddddd');
insert into public.companies(id,name,slug) values
  ('cccccccc-2222-4222-8222-cccccccccccc','Worker Detail A','worker-detail-a'),
  ('dddddddd-2222-4222-8222-dddddddddddd','Worker Detail B','worker-detail-b');
insert into public.organization_members(company_id,user_id,role) values
  ('cccccccc-2222-4222-8222-cccccccccccc','cccccccc-1111-4111-8111-cccccccccccc','owner'),
  ('dddddddd-2222-4222-8222-dddddddddddd','dddddddd-1111-4111-8111-dddddddddddd','owner');
insert into public.workers(id,company_id,name,pin_hash,pin_salt) values
  ('cccccccc-3333-4333-8333-cccccccccccc','cccccccc-2222-4222-8222-cccccccccccc','Worker A','test-hash','test-salt'),
  ('dddddddd-3333-4333-8333-dddddddddddd','dddddddd-2222-4222-8222-dddddddddddd','Worker B','test-hash','test-salt');
insert into public.tools(id,company_id,asset_code,qr_token,name,current_worker_id) values
  ('cccccccc-4444-4444-8444-cccccccccccc','cccccccc-2222-4222-8222-cccccccccccc','DETAIL-A','detail-a-token','Tool A','cccccccc-3333-4333-8333-cccccccccccc'),
  ('dddddddd-4444-4444-8444-dddddddddddd','dddddddd-2222-4222-8222-dddddddddddd','DETAIL-B','detail-b-token','Tool B','dddddddd-3333-4333-8333-dddddddddddd');
insert into public.tool_transactions(company_id,tool_id,transaction_type,to_worker_id) values
  ('cccccccc-2222-4222-8222-cccccccccccc','cccccccc-4444-4444-8444-cccccccccccc','checkout','cccccccc-3333-4333-8333-cccccccccccc'),
  ('dddddddd-2222-4222-8222-dddddddddddd','dddddddd-4444-4444-8444-dddddddddddd','checkout','dddddddd-3333-4333-8333-dddddddddddd');

set local role authenticated;
set local request.jwt.claim.sub = 'cccccccc-1111-4111-8111-cccccccccccc';
do $$
begin
  if (select count(*) from public.workers where company_id='cccccccc-2222-4222-8222-cccccccccccc') <> 1
    or (select count(*) from public.workers where company_id='dddddddd-2222-4222-8222-dddddddddddd') <> 0
    or (select count(*) from public.tools where current_worker_id='cccccccc-3333-4333-8333-cccccccccccc') <> 1
    or (select count(*) from public.tools where current_worker_id='dddddddd-3333-4333-8333-dddddddddddd') <> 0
    or (select count(*) from public.tool_transactions where to_worker_id='dddddddd-3333-4333-8333-dddddddddddd') <> 0
  then raise exception 'Worker detail tenant isolation failed'; end if;
end $$;

rollback;
