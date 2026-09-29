-- Customer-file object lifecycle hardening.
-- Keeps R2 cleanup state durable so deleted database rows never lose the object key before storage deletion succeeds.

alter table public.customer_files
  add column object_deleted_at timestamptz,
  add column r2_delete_attempts integer not null default 0,
  add column r2_delete_last_attempt_at timestamptz,
  add column r2_delete_last_error text;

alter table public.customer_files
  add constraint customer_files_object_deleted_requires_deleted
  check (object_deleted_at is null or status = 'deleted');

create index customer_files_r2_cleanup_idx
  on public.customer_files(status, object_deleted_at, r2_delete_last_attempt_at, deleted_at)
  where status = 'deleted' and object_deleted_at is null;

create function public.customer_file_cleanup_batch(p_limit integer default 100)
returns table(file_id uuid, object_key text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 100), 500));
begin
  update public.customer_files
  set status = 'deleted',
      deleted_at = coalesce(deleted_at, now())
  where status = 'pending'
    and created_at < now() - interval '1 hour';

  return query
  with candidates as (
    select cf.id
    from public.customer_files cf
    where cf.status = 'deleted'
      and cf.object_deleted_at is null
      and (
        cf.r2_delete_last_attempt_at is null
        or cf.r2_delete_last_attempt_at < now() - interval '15 minutes'
      )
    order by cf.deleted_at nulls first, cf.created_at
    limit v_limit
    for update skip locked
  )
  update public.customer_files cf
  set r2_delete_attempts = cf.r2_delete_attempts + 1,
      r2_delete_last_attempt_at = now(),
      r2_delete_last_error = null
  from candidates c
  where cf.id = c.id
  returning cf.id, cf.object_key;
end;
$$;

revoke all on function public.customer_file_cleanup_batch(integer) from public, anon, authenticated;
grant execute on function public.customer_file_cleanup_batch(integer) to service_role;

create function public.record_customer_file_object_cleanup(
  p_file_id uuid,
  p_succeeded boolean,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_succeeded then
    update public.customer_files
    set object_deleted_at = coalesce(object_deleted_at, now()),
        r2_delete_last_error = null
    where id = p_file_id
      and status = 'deleted';
  else
    update public.customer_files
    set r2_delete_last_error = left(coalesce(p_error, 'R2 delete failed'), 1000)
    where id = p_file_id
      and status = 'deleted'
      and object_deleted_at is null;
  end if;
end;
$$;

revoke all on function public.record_customer_file_object_cleanup(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.record_customer_file_object_cleanup(uuid, boolean, text) to service_role;

create function private.prevent_parent_delete_with_live_customer_files()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_exists boolean := false;
begin
  if tg_table_name = 'companies' then
    select exists(
      select 1 from public.customer_files
      where company_id = old.id and object_deleted_at is null
    ) into v_exists;
  elsif tg_table_name = 'tools' then
    select exists(
      select 1 from public.customer_files
      where tool_id = old.id and object_deleted_at is null
    ) into v_exists;
  elsif tg_table_name = 'damage_reports' then
    select exists(
      select 1 from public.customer_files
      where damage_report_id = old.id and object_deleted_at is null
    ) into v_exists;
  elsif tg_table_name = 'maintenance_events' then
    select exists(
      select 1 from public.customer_files
      where maintenance_event_id = old.id and object_deleted_at is null
    ) into v_exists;
  end if;

  if v_exists then
    raise exception 'Customer file objects must be deleted before deleting this record';
  end if;

  return old;
end;
$$;

revoke all on function private.prevent_parent_delete_with_live_customer_files() from public;

create trigger companies_customer_file_delete_guard
before delete on public.companies
for each row execute function private.prevent_parent_delete_with_live_customer_files();

create trigger tools_customer_file_delete_guard
before delete on public.tools
for each row execute function private.prevent_parent_delete_with_live_customer_files();

create trigger damage_reports_customer_file_delete_guard
before delete on public.damage_reports
for each row execute function private.prevent_parent_delete_with_live_customer_files();

create trigger maintenance_events_customer_file_delete_guard
before delete on public.maintenance_events
for each row execute function private.prevent_parent_delete_with_live_customer_files();
