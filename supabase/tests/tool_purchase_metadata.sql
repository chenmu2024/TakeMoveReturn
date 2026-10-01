begin;

insert into auth.users(id) values ('91919191-9191-4191-8191-919191919191');
insert into public.companies(id,name,slug) values
  ('91919191-aaaa-4aaa-8aaa-919191919191','Purchase A','purchase-a'),
  ('92929292-bbbb-4bbb-8bbb-929292929292','Purchase B','purchase-b');
insert into public.organization_members(company_id,user_id,role) values
  ('91919191-aaaa-4aaa-8aaa-919191919191','91919191-9191-4191-8191-919191919191','owner');
insert into public.tools(id,company_id,asset_code,qr_token,name) values
  ('91919191-1111-4111-8111-919191919191','91919191-aaaa-4aaa-8aaa-919191919191','A-PUR',repeat('p',64),'Purchase tool A'),
  ('92929292-1111-4111-8111-929292929292','92929292-bbbb-4bbb-8bbb-929292929292','B-PUR',repeat('q',64),'Purchase tool B');

set local role authenticated;
set local request.jwt.claim.sub = '91919191-9191-4191-8191-919191919191';

update public.tools
set purchase_date = '2026-01-15', purchase_price = 1299.95
where id = '91919191-1111-4111-8111-919191919191';

do $$ begin
  if not exists (
    select 1 from public.tools
    where id = '91919191-1111-4111-8111-919191919191'
      and purchase_date = '2026-01-15'
      and purchase_price = 1299.95
  ) then raise exception 'Own-company purchase metadata update failed'; end if;

  begin
    update public.tools
    set purchase_price = -0.01
    where id = '91919191-1111-4111-8111-919191919191';
    raise exception 'Negative purchase price accepted';
  exception when check_violation then null;
  end;
end $$;

update public.tools
set purchase_price = 1.00
where id = '92929292-1111-4111-8111-929292929292';

reset role;

do $$ begin
  if (select purchase_price from public.tools where id = '92929292-1111-4111-8111-929292929292') is not null then
    raise exception 'Cross-company purchase metadata update succeeded';
  end if;
end $$;

rollback;
