begin;

insert into auth.users(id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.companies(id,name,slug) values
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','Import A','import-job-a'),
  ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb','Import B','import-job-b');
insert into public.organization_members(company_id,user_id,role) values
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','owner');
insert into public.legal_acceptances(user_id,terms_version,privacy_version,terms_accepted_at,privacy_acknowledged_at)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-09-28','2026-09-28',now(),now());
insert into public.tools(company_id,asset_code,qr_token,name) values
  ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb','B-1',repeat('b',64),'Other company tool');

set local role anon;
do $$ begin
  begin
    perform public.create_import_job('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','tools.csv',50,
      '[{"assetCode":"A-1","name":"Drill","category":"Power"}]'::jsonb);
    raise exception 'Anonymous import succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$ declare v_job uuid; begin
  begin
    perform public.create_import_job('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb','tools.csv',50,
      '[{"assetCode":"B-2","name":"Drill","category":"Power"}]'::jsonb);
    raise exception 'Cross-company import succeeded';
  exception when others then if SQLERRM <> 'Forbidden' then raise; end if;
  end;
  begin
    perform public.create_import_job('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','tools.csv',50,
      '[{"assetCode":"A-1","name":"Drill","category":"Power"},{"assetCode":"A-1","name":"Saw","category":"Power"}]'::jsonb);
    raise exception 'Duplicate file code accepted';
  exception when others then if SQLERRM <> 'Duplicate asset codes in import' then raise; end if;
  end;
  v_job := public.create_import_job('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','tools.csv',100,
    '[{"assetCode":"A-1","name":"Drill","category":"Power"},{"assetCode":"A-2","name":"Saw","category":"Power"}]'::jsonb);
  perform set_config('test.import_job_id',v_job::text,true);
  if (select count(*) from public.import_rows where job_id = v_job) <> 2 then
    raise exception 'Import rows not staged';
  end if;
end $$;

set local role service_role;
do $$ declare v_job uuid := current_setting('test.import_job_id')::uuid; begin
  perform public.process_import_batch(v_job,0);
  perform public.process_import_batch(v_job,0);
  if (select imported_rows from public.import_jobs where id = v_job) <> 2
    or (select processed_rows from public.import_jobs where id = v_job) <> 2
    or (select status from public.import_jobs where id = v_job) <> 'completed' then
    raise exception 'Import counts changed on duplicate delivery';
  end if;
  if (select count(*) from public.tools where company_id = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') <> 2 then
    raise exception 'Import did not create exactly two tools';
  end if;
  if (select count(*) from public.tools where company_id = 'bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb') <> 1 then
    raise exception 'Import touched another company';
  end if;
end $$;

rollback;
