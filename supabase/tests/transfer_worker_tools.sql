begin;

insert into auth.users(id) values
  ('acacacac-1111-4111-8111-acacacacacac'),
  ('bdbdbdbd-1111-4111-8111-bdbdbdbdbdbd');
insert into public.companies(id,name,slug) values
  ('acacacac-2222-4222-8222-acacacacacac','Transfer A','transfer-a'),
  ('bdbdbdbd-2222-4222-8222-bdbdbdbdbdbd','Transfer B','transfer-b');
insert into public.organization_members(company_id,user_id,role) values
  ('acacacac-2222-4222-8222-acacacacacac','acacacac-1111-4111-8111-acacacacacac','owner'),
  ('bdbdbdbd-2222-4222-8222-bdbdbdbdbdbd','bdbdbdbd-1111-4111-8111-bdbdbdbdbdbd','owner');
insert into public.workers(id,company_id,name,pin_hash,pin_salt) values
  ('acacacac-3333-4333-8333-acacacacacac','acacacac-2222-4222-8222-acacacacacac','Source','test-hash','test-salt'),
  ('acacacac-4444-4444-8444-acacacacacac','acacacac-2222-4222-8222-acacacacacac','Target','test-hash','test-salt'),
  ('bdbdbdbd-3333-4333-8333-bdbdbdbdbdbd','bdbdbdbd-2222-4222-8222-bdbdbdbdbdbd','Other','test-hash','test-salt');
insert into public.locations(id,company_id,type,name) values
  ('acacacac-5555-4555-8555-acacacacacac','acacacac-2222-4222-8222-acacacacacac','job_site','Site A'),
  ('bdbdbdbd-5555-4555-8555-bdbdbdbdbdbd','bdbdbdbd-2222-4222-8222-bdbdbdbdbdbd','job_site','Site B');
insert into public.tools(id,company_id,asset_code,qr_token,name,status,current_worker_id) values
  ('acacacac-6666-4666-8666-acacacacacac','acacacac-2222-4222-8222-acacacacacac','TRANSFER-1','transfer-a-1','Tool A1','checked_out','acacacac-3333-4333-8333-acacacacacac'),
  ('acacacac-7777-4777-8777-acacacacacac','acacacac-2222-4222-8222-acacacacacac','TRANSFER-2','transfer-a-2','Tool A2','damaged','acacacac-3333-4333-8333-acacacacacac'),
  ('bdbdbdbd-6666-4666-8666-bdbdbdbdbdbd','bdbdbdbd-2222-4222-8222-bdbdbdbdbdbd','TRANSFER-3','transfer-b-1','Tool B','checked_out','bdbdbdbd-3333-4333-8333-bdbdbdbdbdbd');

set local role authenticated;
set local request.jwt.claim.sub = 'acacacac-1111-4111-8111-acacacacacac';
do $$
declare selected uuid[] := array['acacacac-6666-4666-8666-acacacacacac'::uuid,'acacacac-7777-4777-8777-acacacacacac'::uuid];
begin
  begin
    perform public.transfer_worker_tools('bdbdbdbd-3333-4333-8333-bdbdbdbdbdbd',selected,'acacacac-4444-4444-8444-acacacacacac','acacacac-5555-4555-8555-acacacacacac');
    raise exception 'Cross-company source succeeded';
  exception when others then if SQLERRM <> 'Forbidden' then raise; end if;
  end;
  begin
    perform public.transfer_worker_tools('acacacac-3333-4333-8333-acacacacacac',selected,'bdbdbdbd-3333-4333-8333-bdbdbdbdbdbd','acacacac-5555-4555-8555-acacacacacac');
    raise exception 'Cross-company target succeeded';
  exception when others then if SQLERRM <> 'Invalid worker' then raise; end if;
  end;
  begin
    perform public.transfer_worker_tools('acacacac-3333-4333-8333-acacacacacac',selected,'acacacac-4444-4444-8444-acacacacacac','bdbdbdbd-5555-4555-8555-bdbdbdbdbdbd');
    raise exception 'Cross-company location succeeded';
  exception when others then if SQLERRM <> 'Invalid location' then raise; end if;
  end;
  begin
    perform public.transfer_worker_tools('acacacac-3333-4333-8333-acacacacacac',selected,'acacacac-4444-4444-8444-acacacacacac','acacacac-5555-4555-8555-acacacacacac');
    raise exception 'Damaged selection succeeded';
  exception when others then if SQLERRM <> 'Ineligible tools' then raise; end if;
  end;
  begin
    perform public.transfer_worker_tools('acacacac-3333-4333-8333-acacacacacac',array[selected[1],selected[1]],'acacacac-4444-4444-8444-acacacacacac','acacacac-5555-4555-8555-acacacacacac');
    raise exception 'Duplicate selection succeeded';
  exception when others then if SQLERRM <> 'Invalid selection' then raise; end if;
  end;
  begin
    perform public.transfer_worker_tools('acacacac-3333-4333-8333-acacacacacac',array(select gen_random_uuid() from generate_series(1,26)),'acacacac-4444-4444-8444-acacacacacac','acacacac-5555-4555-8555-acacacacacac');
    raise exception 'Over-limit selection succeeded';
  exception when others then if SQLERRM <> 'Invalid selection' then raise; end if;
  end;
end $$;
reset role;
do $$ begin
  if (select count(*) from public.tool_transactions where company_id='acacacac-2222-4222-8222-acacacacacac') <> 0
    then raise exception 'Failed transfer left partial history'; end if;
end $$;
update public.tools set status='checked_out' where company_id='acacacac-2222-4222-8222-acacacacacac' and asset_code='TRANSFER-2';

set local role authenticated;
set local request.jwt.claim.sub = 'acacacac-1111-4111-8111-acacacacacac';
do $$ begin
  if public.transfer_worker_tools('acacacac-3333-4333-8333-acacacacacac',
    array['acacacac-6666-4666-8666-acacacacacac'::uuid,'acacacac-7777-4777-8777-acacacacacac'::uuid],
    'acacacac-4444-4444-8444-acacacacacac','acacacac-5555-4555-8555-acacacacacac') <> 2
    then raise exception 'Wrong transferred count'; end if;
end $$;
reset role;
do $$ begin
  if (select count(*) from public.tools where company_id='acacacac-2222-4222-8222-acacacacacac'
    and current_worker_id='acacacac-4444-4444-8444-acacacacacac'
    and current_location_id='acacacac-5555-4555-8555-acacacacacac' and status='checked_out') <> 2
    or (select count(*) from public.tool_transactions where company_id='acacacac-2222-4222-8222-acacacacacac'
      and transaction_type='transfer' and from_worker_id='acacacac-3333-4333-8333-acacacacacac'
      and to_worker_id='acacacac-4444-4444-8444-acacacacacac'
      and performed_by_user_id='acacacac-1111-4111-8111-acacacacacac') <> 2
    or (select count(*) from public.tools where company_id='bdbdbdbd-2222-4222-8222-bdbdbdbdbdbd'
      and current_worker_id='bdbdbdbd-3333-4333-8333-bdbdbdbdbdbd') <> 1
    then raise exception 'Transfer state/history isolation failed'; end if;
end $$;

rollback;
