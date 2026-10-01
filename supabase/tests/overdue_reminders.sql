begin;

insert into auth.users(id,email) values
  ('e1111111-1111-4111-8111-111111111111','manager@example.com');

insert into public.companies(id,name,slug,timezone) values
  ('e1111111-aaaa-4aaa-8aaa-111111111111','Reminder Co','reminder-co','America/Los_Angeles');

insert into public.organization_members(company_id,user_id,role,status) values
  ('e1111111-aaaa-4aaa-8aaa-111111111111','e1111111-1111-4111-8111-111111111111','manager','active');

insert into public.locations(id,company_id,type,name) values
  ('e1111111-2000-4000-8000-111111111111','e1111111-aaaa-4aaa-8aaa-111111111111','warehouse','Shop');

insert into public.workers(id,company_id,name,pin_hash,pin_salt) values
  ('e1111111-3000-4000-8000-111111111111','e1111111-aaaa-4aaa-8aaa-111111111111','Worker','hash','salt');

insert into public.tools(
  id,company_id,asset_code,qr_token,name,status,current_worker_id,current_location_id,expected_return_date
) values (
  'e1111111-4000-4000-8000-111111111111',
  'e1111111-aaaa-4aaa-8aaa-111111111111',
  'REM-1',repeat('e',64),'Overdue drill','checked_out',
  'e1111111-3000-4000-8000-111111111111',
  'e1111111-2000-4000-8000-111111111111',
  ((now() at time zone 'America/Los_Angeles')::date - 2)
);

set local role service_role;

do $$
declare
  v_id uuid;
  v_count bigint;
  v_email text;
begin
  select dispatch_id,overdue_count,recipient_email
    into v_id,v_count,v_email
  from public.overdue_reminder_candidates(10)
  limit 1;

  if v_id is null or v_count <> 1 or v_email <> 'manager@example.com' then
    raise exception 'Reminder candidate was not created correctly';
  end if;

  if exists(select 1 from public.overdue_reminder_candidates(10)) then
    raise exception 'Pending reminder was returned twice for the same local date';
  end if;

  perform public.complete_overdue_reminder(v_id,true,null);

  if (select status from public.overdue_reminder_dispatches where id=v_id) <> 'sent' then
    raise exception 'Reminder completion was not recorded';
  end if;

  if exists(select 1 from public.overdue_reminder_candidates(10)) then
    raise exception 'Sent reminder was returned again for the same local date';
  end if;
end $$;

rollback;
