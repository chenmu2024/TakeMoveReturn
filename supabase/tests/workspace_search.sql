begin;

insert into auth.users(id) values
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'),
  ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb');
insert into public.companies(id,name,slug) values
  ('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','Search A','search-a'),
  ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb','Search B','search-b');
insert into public.organization_members(company_id,user_id,role) values
  ('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','owner'),
  ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb','bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb','owner');
insert into public.tools(company_id,asset_code,qr_token,name,brand,model,serial_number,notes) values
  ('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','M18-1','search-a-tool','Impact Driver','Milwaukee','M18','SER-1','Crew% note'),
  ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb','M18-2','search-b-tool','Impact Driver','Milwaukee','M18','SER-2','Other company');
insert into public.workers(company_id,name,employee_code,pin_hash,pin_salt) values
  ('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','Jane Worker','JW-1','test-hash','test-salt');
insert into public.locations(company_id,name,type,address,notes) values
  ('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','North Job Site','job_site','10 Main St','First phase');

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
do $$
declare n integer;
begin
  select count(*) into n from public.search_workspace('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','M18');
  if n <> 1 then raise exception 'Own tool search failed: %', n; end if;
  select count(*) into n from public.search_workspace('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','Jane');
  if n <> 1 then raise exception 'Own worker search failed: %', n; end if;
  select count(*) into n from public.search_workspace('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','job_site');
  if n <> 1 then raise exception 'Location type search failed: %', n; end if;
  select count(*) into n from public.search_workspace('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','%_');
  if n <> 0 then raise exception 'Wildcard escaping failed: %', n; end if;
  begin
    perform public.search_workspace('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb','M18');
    raise exception 'Cross-company search succeeded';
  exception when others then if SQLERRM <> 'Forbidden' then raise; end if;
  end;
  begin
    perform public.search_workspace('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','x');
    raise exception 'Short query succeeded';
  exception when others then if SQLERRM <> 'Invalid search' then raise; end if;
  end;
end $$;

set local request.jwt.claim.sub = 'bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb';
do $$
declare n integer;
begin
  select count(*) into n from public.search_workspace('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb','M18');
  if n <> 1 then raise exception 'Second company search failed: %', n; end if;
end $$;

rollback;
