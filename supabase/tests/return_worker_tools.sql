begin;

insert into auth.users(id) values
  ('abababab-1111-4111-8111-abababababab'),
  ('cdcdcdcd-1111-4111-8111-cdcdcdcdcdcd');
insert into public.companies(id,name,slug) values
  ('abababab-2222-4222-8222-abababababab','Bulk Return A','bulk-return-a'),
  ('cdcdcdcd-2222-4222-8222-cdcdcdcdcdcd','Bulk Return B','bulk-return-b');
insert into public.organization_members(company_id,user_id,role) values
  ('abababab-2222-4222-8222-abababababab','abababab-1111-4111-8111-abababababab','owner'),
  ('cdcdcdcd-2222-4222-8222-cdcdcdcdcdcd','cdcdcdcd-1111-4111-8111-cdcdcdcdcdcd','owner');
insert into public.workers(id,company_id,name,pin_hash,pin_salt) values
  ('abababab-3333-4333-8333-abababababab','abababab-2222-4222-8222-abababababab','Worker A','test-hash','test-salt'),
  ('cdcdcdcd-3333-4333-8333-cdcdcdcdcdcd','cdcdcdcd-2222-4222-8222-cdcdcdcdcdcd','Worker B','test-hash','test-salt');
insert into public.locations(id,company_id,type,name) values
  ('abababab-4444-4444-8444-abababababab','abababab-2222-4222-8222-abababababab','warehouse','Warehouse A'),
  ('cdcdcdcd-4444-4444-8444-cdcdcdcdcdcd','cdcdcdcd-2222-4222-8222-cdcdcdcdcdcd','warehouse','Warehouse B');
insert into public.tools(company_id,asset_code,qr_token,name,status,current_worker_id) values
  ('abababab-2222-4222-8222-abababababab','RETURN-1','return-a-1','Tool A1','checked_out','abababab-3333-4333-8333-abababababab'),
  ('abababab-2222-4222-8222-abababababab','RETURN-2','return-a-2','Tool A2','damaged','abababab-3333-4333-8333-abababababab'),
  ('cdcdcdcd-2222-4222-8222-cdcdcdcdcdcd','RETURN-3','return-b-1','Tool B','checked_out','cdcdcdcd-3333-4333-8333-cdcdcdcdcdcd');

set local role authenticated;
set local request.jwt.claim.sub = 'abababab-1111-4111-8111-abababababab';
do $$ begin
  begin
    perform public.return_worker_tools('cdcdcdcd-3333-4333-8333-cdcdcdcdcdcd','cdcdcdcd-4444-4444-8444-cdcdcdcdcdcd');
    raise exception 'Cross-company return succeeded';
  exception when others then if SQLERRM <> 'Forbidden' then raise; end if;
  end;
  begin
    perform public.return_worker_tools('abababab-3333-4333-8333-abababababab','cdcdcdcd-4444-4444-8444-cdcdcdcdcdcd');
    raise exception 'Cross-company location succeeded';
  exception when others then if SQLERRM <> 'Invalid location' then raise; end if;
  end;
  begin
    perform public.return_worker_tools('abababab-3333-4333-8333-abababababab','abababab-4444-4444-8444-abababababab');
    raise exception 'Damaged tool was returned';
  exception when others then if SQLERRM <> 'Ineligible tools' then raise; end if;
  end;
end $$;
reset role;
do $$ begin
  if (select count(*) from public.tool_transactions where company_id='abababab-2222-4222-8222-abababababab') <> 0
    then raise exception 'Failed bulk return left partial history'; end if;
end $$;
update public.tools set status='checked_out' where company_id='abababab-2222-4222-8222-abababababab' and asset_code='RETURN-2';

set local role authenticated;
set local request.jwt.claim.sub = 'abababab-1111-4111-8111-abababababab';
do $$ begin
  if public.return_worker_tools('abababab-3333-4333-8333-abababababab','abababab-4444-4444-8444-abababababab') <> 2
    then raise exception 'Wrong returned count'; end if;
  begin
    perform public.return_worker_tools('abababab-3333-4333-8333-abababababab','abababab-4444-4444-8444-abababababab');
    raise exception 'Empty return succeeded';
  exception when others then if SQLERRM <> 'No tools to return' then raise; end if;
  end;
end $$;
reset role;
do $$ begin
  if (select count(*) from public.tools where company_id='abababab-2222-4222-8222-abababababab'
    and status='available' and current_worker_id is null and current_location_id='abababab-4444-4444-8444-abababababab') <> 2
    or (select count(*) from public.tool_transactions where company_id='abababab-2222-4222-8222-abababababab'
      and transaction_type='return' and from_worker_id='abababab-3333-4333-8333-abababababab'
      and performed_by_user_id='abababab-1111-4111-8111-abababababab') <> 2
    or (select count(*) from public.tools where company_id='cdcdcdcd-2222-4222-8222-cdcdcdcdcdcd' and status='checked_out') <> 1
    then raise exception 'Bulk return state/history isolation failed'; end if;
end $$;

insert into public.tools(company_id,asset_code,qr_token,name,status,current_worker_id)
select 'abababab-2222-4222-8222-abababababab', 'LIMIT-'||n, 'limit-qr-'||n, 'Limit Tool '||n,
  'checked_out', 'abababab-3333-4333-8333-abababababab' from generate_series(1,101) n;
set local role authenticated;
set local request.jwt.claim.sub = 'abababab-1111-4111-8111-abababababab';
do $$ begin
  begin
    perform public.return_worker_tools('abababab-3333-4333-8333-abababababab','abababab-4444-4444-8444-abababababab');
    raise exception 'Over-limit return succeeded';
  exception when others then if SQLERRM <> 'Too many tools' then raise; end if;
  end;
end $$;
reset role;
do $$ begin
  if (select count(*) from public.tools where company_id='abababab-2222-4222-8222-abababababab'
    and current_worker_id='abababab-3333-4333-8333-abababababab') <> 101
    then raise exception 'Over-limit return changed custody'; end if;
end $$;

rollback;
