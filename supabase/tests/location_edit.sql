begin;

insert into auth.users(id) values
  ('cccccccc-1111-4111-8111-cccccccccccc'),
  ('dddddddd-1111-4111-8111-dddddddddddd');
insert into public.companies(id,name,slug) values
  ('cccccccc-2222-4222-8222-cccccccccccc','Location A','location-a'),
  ('dddddddd-2222-4222-8222-dddddddddddd','Location B','location-b');
insert into public.organization_members(company_id,user_id,role) values
  ('cccccccc-2222-4222-8222-cccccccccccc','cccccccc-1111-4111-8111-cccccccccccc','owner'),
  ('dddddddd-2222-4222-8222-dddddddddddd','dddddddd-1111-4111-8111-dddddddddddd','owner');
insert into public.locations(id,company_id,type,name) values
  ('cccccccc-3333-4333-8333-cccccccccccc','cccccccc-2222-4222-8222-cccccccccccc','warehouse','A warehouse'),
  ('dddddddd-3333-4333-8333-dddddddddddd','dddddddd-2222-4222-8222-dddddddddddd','job_site','B site');

set local role authenticated;
set local request.jwt.claim.sub = 'cccccccc-1111-4111-8111-cccccccccccc';
do $$
begin
  update public.locations set name = 'A updated', address = 'A address'
  where id = 'cccccccc-3333-4333-8333-cccccccccccc';
  if not found then raise exception 'Own location update failed'; end if;
  update public.locations set name = 'B tampered'
  where id = 'dddddddd-3333-4333-8333-dddddddddddd';
  if found then raise exception 'Cross-company location update succeeded'; end if;
end $$;

reset role;
do $$
begin
  if (select name from public.locations where id = 'cccccccc-3333-4333-8333-cccccccccccc') <> 'A updated'
    or (select address from public.locations where id = 'cccccccc-3333-4333-8333-cccccccccccc') <> 'A address'
    then raise exception 'Own location changes were not saved'; end if;
  if (select name from public.locations where id = 'dddddddd-3333-4333-8333-dddddddddddd') <> 'B site'
    then raise exception 'Other company location changed'; end if;
end $$;

rollback;
