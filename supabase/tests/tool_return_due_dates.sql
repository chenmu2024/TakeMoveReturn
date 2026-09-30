begin;

insert into auth.users(id) values
  ('a1111111-1111-4111-8111-111111111111'),
  ('a2222222-2222-4222-8222-222222222222');
insert into public.companies(id,name,slug) values
  ('a1111111-aaaa-4aaa-8aaa-111111111111','Due A','due-a'),
  ('a2222222-bbbb-4bbb-8bbb-222222222222','Due B','due-b');
insert into public.organization_members(company_id,user_id,role) values
  ('a1111111-aaaa-4aaa-8aaa-111111111111','a1111111-1111-4111-8111-111111111111','manager'),
  ('a2222222-bbbb-4bbb-8bbb-222222222222','a2222222-2222-4222-8222-222222222222','owner');
insert into public.tools(id,company_id,asset_code,qr_token,name,status) values
  ('a1111111-1000-4000-8000-111111111111','a1111111-aaaa-4aaa-8aaa-111111111111','DUE-A',repeat('a',64),'Due tool','checked_out'),
  ('a2222222-2000-4000-8000-222222222222','a2222222-bbbb-4bbb-8bbb-222222222222','DUE-B',repeat('b',64),'Other tool','checked_out');

set local role authenticated;
set local request.jwt.claim.sub = 'a1111111-1111-4111-8111-111111111111';
do $$ begin
  if not public.set_tool_return_due_date('a1111111-1000-4000-8000-111111111111',now() + interval '2 days')
    then raise exception 'Manager could not set due date'; end if;
  if public.set_tool_return_due_date('a1111111-1000-4000-8000-111111111111',
    (select expected_return_at from public.tools where id='a1111111-1000-4000-8000-111111111111'))
    then raise exception 'Unchanged due date was audited'; end if;
  begin
    perform public.set_tool_return_due_date('a2222222-2000-4000-8000-222222222222',now() + interval '1 day');
    raise exception 'Cross-company due date changed';
  exception when others then if SQLERRM <> 'Forbidden' then raise; end if; end;
  begin
    perform public.set_tool_return_due_date('a1111111-1000-4000-8000-111111111111',now() - interval '1 day');
    raise exception 'Past due date accepted';
  exception when others then if SQLERRM <> 'Due date must be in the future' then raise; end if; end;
end $$;

reset role;
do $$ begin
  if (select count(*) from public.tool_transactions where tool_id='a1111111-1000-4000-8000-111111111111'
    and transaction_type='correction') <> 1 then raise exception 'Due date audit missing'; end if;
  update public.tools set status='available' where id='a1111111-1000-4000-8000-111111111111';
  if (select expected_return_at from public.tools where id='a1111111-1000-4000-8000-111111111111') is not null
    then raise exception 'Return did not clear due date'; end if;
  if (select expected_return_at from public.tools where id='a2222222-2000-4000-8000-222222222222') is not null
    then raise exception 'Other company changed'; end if;
end $$;

rollback;
