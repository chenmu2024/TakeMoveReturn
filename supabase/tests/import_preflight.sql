begin;

insert into auth.users(id) values ('88888888-8888-4888-8888-888888888888');
insert into public.companies(id,name,slug) values
  ('88888888-aaaa-4aaa-8aaa-888888888888','Import A','import-a'),
  ('99999999-bbbb-4bbb-8bbb-999999999999','Import B','import-b');
insert into public.organization_members(company_id,user_id,role) values
  ('88888888-aaaa-4aaa-8aaa-888888888888','88888888-8888-4888-8888-888888888888','owner');
insert into public.tools(company_id,asset_code,qr_token,name) values
  ('88888888-aaaa-4aaa-8aaa-888888888888','A-1',repeat('a',64),'A tool'),
  ('99999999-bbbb-4bbb-8bbb-999999999999','B-1',repeat('b',64),'B tool');

set local role anon;
do $$ begin
  begin
    perform public.import_existing_asset_codes('88888888-aaaa-4aaa-8aaa-888888888888',array['A-1']);
    raise exception 'Anonymous import lookup succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

set local role authenticated;
set local request.jwt.claim.sub = '88888888-8888-4888-8888-888888888888';
do $$ declare v_codes text[]; begin
  v_codes := public.import_existing_asset_codes('88888888-aaaa-4aaa-8aaa-888888888888',array['A-1','B-1','NEW']);
  if v_codes <> array['A-1'] then raise exception 'Import lookup leaked or missed codes'; end if;
  begin
    perform public.import_existing_asset_codes('99999999-bbbb-4bbb-8bbb-999999999999',array['B-1']);
    raise exception 'Cross-company import lookup succeeded';
  exception when others then if SQLERRM <> 'Forbidden' then raise; end if;
  end;
  begin
    perform public.import_existing_asset_codes('88888888-aaaa-4aaa-8aaa-888888888888',array_fill('A',array[5001]));
    raise exception 'Over-limit import lookup succeeded';
  exception when others then if SQLERRM <> 'Invalid import size' then raise; end if;
  end;
end $$;

rollback;
