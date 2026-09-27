begin;

insert into auth.users(id) values
  ('eeeeeeee-1111-4111-8111-eeeeeeeeeeee'),
  ('eeeeeeee-2222-4222-8222-eeeeeeeeeeee'),
  ('ffffffff-1111-4111-8111-ffffffffffff');
insert into public.companies(id,name,slug) values
  ('eeeeeeee-3333-4333-8333-eeeeeeeeeeee','Settings A','settings-a'),
  ('ffffffff-3333-4333-8333-ffffffffffff','Settings B','settings-b');
insert into public.organization_members(company_id,user_id,role) values
  ('eeeeeeee-3333-4333-8333-eeeeeeeeeeee','eeeeeeee-1111-4111-8111-eeeeeeeeeeee','owner'),
  ('eeeeeeee-3333-4333-8333-eeeeeeeeeeee','eeeeeeee-2222-4222-8222-eeeeeeeeeeee','manager'),
  ('ffffffff-3333-4333-8333-ffffffffffff','ffffffff-1111-4111-8111-ffffffffffff','owner');

set local role authenticated;
set local request.jwt.claim.sub = 'eeeeeeee-1111-4111-8111-eeeeeeeeeeee';
do $$ begin
  if not public.update_company_settings('eeeeeeee-3333-4333-8333-eeeeeeeeeeee','Updated A','Asia/Shanghai')
    then raise exception 'Owner update failed'; end if;
  begin
    perform public.update_company_settings('ffffffff-3333-4333-8333-ffffffffffff','Stolen','UTC');
    raise exception 'Cross-company update succeeded';
  exception when others then if SQLERRM <> 'Forbidden' then raise; end if;
  end;
  begin
    perform public.update_company_settings('eeeeeeee-3333-4333-8333-eeeeeeeeeeee','Updated A','Not/A_Timezone');
    raise exception 'Invalid timezone succeeded';
  exception when others then if SQLERRM <> 'Invalid timezone' then raise; end if;
  end;
end $$;

set local request.jwt.claim.sub = 'eeeeeeee-2222-4222-8222-eeeeeeeeeeee';
do $$ begin
  begin
    perform public.update_company_settings('eeeeeeee-3333-4333-8333-eeeeeeeeeeee','Manager change','UTC');
    raise exception 'Manager update succeeded';
  exception when others then if SQLERRM <> 'Forbidden' then raise; end if;
  end;
end $$;

reset role;
do $$ begin
  if (select name from public.companies where id='eeeeeeee-3333-4333-8333-eeeeeeeeeeee') <> 'Updated A'
    or (select timezone from public.companies where id='eeeeeeee-3333-4333-8333-eeeeeeeeeeee') <> 'Asia/Shanghai'
    or (select plan from public.companies where id='eeeeeeee-3333-4333-8333-eeeeeeeeeeee') <> 'free'
    then raise exception 'Allowed settings or plan changed incorrectly'; end if;
  if (select name from public.companies where id='ffffffff-3333-4333-8333-ffffffffffff') <> 'Settings B'
    then raise exception 'Other company changed'; end if;
end $$;

rollback;
