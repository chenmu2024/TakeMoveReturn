create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  filename text not null,
  file_size integer not null,
  total_rows integer not null check (total_rows between 1 and 5000),
  processed_rows integer not null default 0,
  imported_rows integer not null default 0,
  failed_rows integer not null default 0,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table public.import_rows (
  job_id uuid not null references public.import_jobs(id) on delete cascade,
  row_number integer not null,
  asset_code text not null,
  name text not null,
  category text,
  status text not null default 'pending' check (status in ('pending', 'imported', 'failed')),
  error_message text,
  tool_id uuid references public.tools(id),
  primary key (job_id, row_number)
);

create table public.import_batches (
  job_id uuid not null references public.import_jobs(id) on delete cascade,
  batch_number integer not null,
  processed_at timestamptz,
  primary key (job_id, batch_number)
);

create index import_jobs_company_created_idx on public.import_jobs(company_id, created_at desc);
create index import_rows_job_status_idx on public.import_rows(job_id, status);

alter table public.import_jobs enable row level security;
alter table public.import_rows enable row level security;
alter table public.import_batches enable row level security;

create policy "managers read import jobs" on public.import_jobs for select to authenticated
using (public.can_manage_company(company_id));
create policy "managers read import rows" on public.import_rows for select to authenticated
using (exists (select 1 from public.import_jobs job where job.id = job_id and public.can_manage_company(job.company_id)));

revoke all on public.import_jobs, public.import_rows, public.import_batches from public, anon, authenticated;
grant select on public.import_jobs, public.import_rows to authenticated;

create function public.create_import_job(p_company_id uuid, p_filename text, p_file_size integer, p_rows jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_job_id uuid;
  v_count integer;
  v_index integer;
  v_row jsonb;
  v_code text;
  v_name text;
  v_category text;
  v_plan text;
  v_limit integer;
  v_active integer;
begin
  if auth.uid() is null or not private.can_manage_company(p_company_id) then raise exception 'Forbidden'; end if;
  if not exists (select 1 from public.legal_acceptances a where a.user_id = auth.uid()
    and a.terms_version = '2026-09-28' and a.privacy_version = '2026-09-28') then
    raise exception 'Current terms acceptance required';
  end if;
  if p_filename is null or char_length(p_filename) not between 1 and 255
    or p_file_size not between 1 and 10485760 or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Invalid import file';
  end if;
  v_count := jsonb_array_length(p_rows);
  if v_count not between 1 and 5000 then raise exception 'Invalid import size'; end if;
  select plan into v_plan from public.companies where id = p_company_id for update;
  if not found then raise exception 'Company not found'; end if;
  v_limit := case v_plan when 'free' then 25 when 'starter' then 200
    when 'growth' then 600 when 'pro' then 2000 else 0 end;
  select count(*) into v_active from public.tools
  where company_id = p_company_id and status <> 'retired';
  if v_active + v_count > v_limit then raise exception 'Tool limit reached'; end if;
  insert into public.import_jobs(company_id, user_id, filename, file_size, total_rows)
  values (p_company_id, auth.uid(), p_filename, p_file_size, v_count) returning id into v_job_id;
  for v_index in 0..v_count - 1 loop
    v_row := p_rows -> v_index;
    if jsonb_typeof(v_row) <> 'object'
      or jsonb_typeof(v_row -> 'assetCode') <> 'string'
      or jsonb_typeof(v_row -> 'name') <> 'string'
      or jsonb_typeof(v_row -> 'category') <> 'string' then
      raise exception 'Invalid import row';
    end if;
    v_code := btrim(v_row ->> 'assetCode');
    v_name := btrim(v_row ->> 'name');
    v_category := nullif(btrim(v_row ->> 'category'), '');
    if char_length(v_code) not between 1 and 80
      or char_length(v_name) not between 2 and 120
      or (v_category is not null and char_length(v_category) > 80) then
      raise exception 'Invalid import row';
    end if;
    insert into public.import_rows(job_id, row_number, asset_code, name, category)
    values (v_job_id, v_index + 2, v_code, v_name, v_category);
  end loop;
  if exists (select 1 from public.import_rows row
    where row.job_id = v_job_id group by row.asset_code having count(*) > 1) then
    raise exception 'Duplicate asset codes in import';
  end if;
  if exists (select 1 from public.import_rows row join public.tools tool
    on tool.company_id = p_company_id and tool.asset_code = row.asset_code
    where row.job_id = v_job_id) then
    raise exception 'Asset code already exists in this company';
  end if;
  insert into public.import_batches(job_id, batch_number)
  select v_job_id, generate_series(0, (v_count - 1) / 100);
  return v_job_id;
end;
$$;

revoke all on function public.create_import_job(uuid, text, integer, jsonb) from public;
grant execute on function public.create_import_job(uuid, text, integer, jsonb) to authenticated;

create function public.process_import_batch(p_job_id uuid, p_batch_number integer)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_batch public.import_batches%rowtype;
  v_job public.import_jobs%rowtype;
  v_plan text;
  v_limit integer;
  v_active integer;
  v_row public.import_rows%rowtype;
  v_tool_id uuid;
  v_imported integer := 0;
  v_failed integer := 0;
begin
  if auth.role() <> 'service_role' then raise exception 'Forbidden'; end if;
  select * into v_batch from public.import_batches
  where job_id = p_job_id and batch_number = p_batch_number for update;
  if not found then raise exception 'Import batch not found'; end if;
  if v_batch.processed_at is not null then return; end if;
  select * into v_job from public.import_jobs where id = p_job_id for update;
  select plan into v_plan from public.companies where id = v_job.company_id for update;
  if not found then raise exception 'Company not found'; end if;
  v_limit := case v_plan when 'free' then 25 when 'starter' then 200
    when 'growth' then 600 when 'pro' then 2000 else 0 end;
  select count(*) into v_active from public.tools
  where company_id = v_job.company_id and status <> 'retired';
  for v_row in select * from public.import_rows
    where job_id = p_job_id and row_number between p_batch_number * 100 + 2 and p_batch_number * 100 + 101
    order by row_number loop
    if v_active >= v_limit then
      update public.import_rows set status = 'failed', error_message = 'Plan tool limit reached'
      where job_id = p_job_id and row_number = v_row.row_number;
      v_failed := v_failed + 1;
      continue;
    end if;
    begin
      insert into public.tools(company_id, asset_code, qr_token, name, category)
      values (v_job.company_id, v_row.asset_code,
        replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
        v_row.name, v_row.category) returning id into v_tool_id;
      update public.import_rows set status = 'imported', tool_id = v_tool_id
      where job_id = p_job_id and row_number = v_row.row_number;
      v_active := v_active + 1;
      v_imported := v_imported + 1;
    exception when unique_violation then
      update public.import_rows set status = 'failed', error_message = 'Asset code already exists in this company'
      where job_id = p_job_id and row_number = v_row.row_number;
      v_failed := v_failed + 1;
    end;
  end loop;
  update public.import_batches set processed_at = now()
  where job_id = p_job_id and batch_number = p_batch_number;
  update public.import_jobs set
    status = case when not exists (select 1 from public.import_batches b
      where b.job_id = p_job_id and b.processed_at is null) then 'completed' else 'running' end,
    started_at = coalesce(started_at, now()),
    completed_at = case when not exists (select 1 from public.import_batches b
      where b.job_id = p_job_id and b.processed_at is null) then now() else null end,
    processed_rows = processed_rows + v_imported + v_failed,
    imported_rows = imported_rows + v_imported,
    failed_rows = failed_rows + v_failed
  where id = p_job_id;
end;
$$;

revoke all on function public.process_import_batch(uuid, integer) from public, anon, authenticated;
grant execute on function public.process_import_batch(uuid, integer) to service_role;
