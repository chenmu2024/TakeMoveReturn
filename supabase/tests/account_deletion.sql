begin;

insert into auth.users(id,email) values
  ('a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1','owner-a@example.com'),
  ('b2b2b2b2-2222-4222-8222-b2b2b2b2b2b2','owner-b@example.com');
insert into public.companies(id,name,slug) values
  ('a1a1a1a1-aaaa-4aaa-8aaa-a1a1a1a1a1a1','Delete A','delete-a');
insert into public.organization_members(company_id,user_id,role) values
  ('a1a1a1a1-aaaa-4aaa-8aaa-a1a1a1a1a1a1','a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1','owner');
insert into public.tools(id,company_id,asset_code,qr_token,name) values
  ('a1a1a1a1-3333-4333-8333-a1a1a1a1a1a1','a1a1a1a1-aaaa-4aaa-8aaa-a1a1a1a1a1a1','DEL-1',repeat('a',64),'Deletion audit tool');
insert into public.privacy_requests(id,company_id,requester_user_id,request_type)
values (
  'a1a1a1a1-4444-4444-8444-a1a1a1a1a1a1',
  'a1a1a1a1-aaaa-4aaa-8aaa-a1a1a1a1a1a1',
  'a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1',
  'deletion'
);
insert into public.tool_transactions(
  company_id,tool_id,transaction_type,performed_by_user_id
) values (
  'a1a1a1a1-aaaa-4aaa-8aaa-a1a1a1a1a1a1',
  'a1a1a1a1-3333-4333-8333-a1a1a1a1a1a1',
  'correction',
  'a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1'
);
insert into public.tool_qr_rotations(company_id,tool_id,rotated_by)
values (
  'a1a1a1a1-aaaa-4aaa-8aaa-a1a1a1a1a1a1',
  'a1a1a1a1-3333-4333-8333-a1a1a1a1a1a1',
  'a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1'
);
insert into public.import_jobs(company_id,user_id,filename,file_size,total_rows,status)
values (
  'a1a1a1a1-aaaa-4aaa-8aaa-a1a1a1a1a1a1',
  'a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1',
  'delete-test.csv',10,1,'completed'
);
insert into public.workspace_invitations(company_id,email,role,status,invited_by)
values (
  'a1a1a1a1-aaaa-4aaa-8aaa-a1a1a1a1a1a1',
  'invitee@example.com','manager','revoked',
  'a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1'
);

set local role service_role;
do $$ begin
  begin
    perform public.begin_account_deletion(
      'a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1',
      'a1a1a1a1-4444-4444-8444-a1a1a1a1a1a1'
    );
    raise exception 'Sole owner deletion was allowed';
  exception when others then
    if SQLERRM <> 'Owner transfer or workspace deletion required' then raise; end if;
  end;
end $$;

reset role;
insert into public.organization_members(company_id,user_id,role) values
  ('a1a1a1a1-aaaa-4aaa-8aaa-a1a1a1a1a1a1','b2b2b2b2-2222-4222-8222-b2b2b2b2b2b2','owner');

set local role service_role;
select public.begin_account_deletion(
  'a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1',
  'a1a1a1a1-4444-4444-8444-a1a1a1a1a1a1'
);

reset role;
do $$ begin
  if (select status from public.privacy_requests where id='a1a1a1a1-4444-4444-8444-a1a1a1a1a1a1') <> 'in_review' then
    raise exception 'Deletion request did not enter review';
  end if;
end $$;

delete from auth.users where id='a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1';

do $$ begin
  if exists (
    select 1 from public.organization_members
    where user_id='a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1'
  ) then raise exception 'Deleted account membership remained'; end if;

  if exists (
    select 1 from public.tool_transactions
    where performed_by_user_id='a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1'
  ) then raise exception 'Transaction user was not pseudonymized'; end if;

  if exists (
    select 1 from public.tool_qr_rotations
    where rotated_by='a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1'
  ) then raise exception 'QR rotation user was not pseudonymized'; end if;

  if exists (
    select 1 from public.import_jobs
    where user_id='a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1'
  ) then raise exception 'Import user was not pseudonymized'; end if;

  if exists (
    select 1 from public.workspace_invitations
    where invited_by='a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1'
  ) then raise exception 'Invitation actor was not pseudonymized'; end if;

  if (select requester_user_id from public.privacy_requests where id='a1a1a1a1-4444-4444-8444-a1a1a1a1a1a1') is not null then
    raise exception 'Privacy request requester was not pseudonymized';
  end if;
end $$;

rollback;
