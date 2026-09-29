-- Customer-file metadata and quota reservations for the dedicated R2 file bucket.
-- The product feature remains gated by CUSTOMER_FILES_ENABLED until the R2 binding is provisioned.

create type public.customer_file_kind as enum ('tool_photo', 'damage_photo', 'maintenance_attachment');
create type public.customer_file_status as enum ('pending', 'ready', 'deleted');

create table public.customer_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  kind public.customer_file_kind not null,
  tool_id uuid references public.tools(id) on delete cascade,
  damage_report_id uuid references public.damage_reports(id) on delete cascade,
  maintenance_event_id uuid references public.maintenance_events(id) on delete cascade,
  object_key text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 180),
  content_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  status public.customer_file_status not null default 'pending',
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  ready_at timestamptz,
  deleted_at timestamptz,
  check (
    (kind = 'tool_photo' and tool_id is not null and damage_report_id is null and maintenance_event_id is null)
    or (kind = 'damage_photo' and tool_id is null and damage_report_id is not null and maintenance_event_id is null)
    or (kind = 'maintenance_attachment' and tool_id is null and damage_report_id is null and maintenance_event_id is not null)
  ),
  check (
    (status = 'pending' and ready_at is null and deleted_at is null)
    or (status = 'ready' and ready_at is not null and deleted_at is null)
    or (status = 'deleted' and deleted_at is not null)
  )
);

create index customer_files_company_status_idx on public.customer_files(company_id, status, created_at desc);
create index customer_files_tool_idx on public.customer_files(tool_id, created_at desc) where tool_id is not null and status = 'ready';
create index customer_files_damage_idx on public.customer_files(damage_report_id, created_at desc) where damage_report_id is not null and status = 'ready';
create index customer_files_maintenance_idx on public.customer_files(maintenance_event_id, created_at desc) where maintenance_event_id is not null and status = 'ready';

alter table public.customer_files enable row level security;
create policy "members read ready customer files" on public.customer_files
  for select to authenticated
  using (status = 'ready' and private.is_active_member(company_id));

revoke all on public.customer_files from public, anon, authenticated;
grant select on public.customer_files to authenticated;

create or replace function private.plan_storage_limit(p_plan text)
returns bigint language sql immutable set search_path = '' as $$
  select case p_plan
    when 'free' then 104857600::bigint
    when 'starter' then 2147483648::bigint
    when 'growth' then 10737418240::bigint
    when 'pro' then 26843545600::bigint
    else 0::bigint
  end;
$$;
revoke all on function private.plan_storage_limit(text) from public;

create function public.reserve_customer_file(
  p_kind public.customer_file_kind,
  p_subject_id uuid,
  p_original_name text,
  p_content_type text,
  p_size_bytes bigint
) returns table (
  file_id uuid,
  object_key text,
  reserved_bytes bigint,
  storage_limit_bytes bigint
)
language plpgsql security definer set search_path = '' as $$
declare
  v_company_id uuid;
  v_plan text;
  v_limit bigint;
  v_reserved bigint;
  v_file_id uuid := gen_random_uuid();
  v_object_key text;
  v_name text := btrim(coalesce(p_original_name, ''));
  v_type text := lower(btrim(coalesce(p_content_type, '')));
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select m.company_id into v_company_id
  from public.organization_members m
  where m.user_id = auth.uid()
    and m.status = 'active'
    and m.role in ('owner', 'admin', 'manager')
  order by m.created_at
  limit 1;
  if v_company_id is null then raise exception 'Manager access required'; end if;

  if p_subject_id is null then raise exception 'Subject required'; end if;
  if p_size_bytes is null or p_size_bytes < 1 or p_size_bytes > 10485760 then
    raise exception 'File size must be between 1 byte and 10 MB';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 180
    or position('/' in v_name) > 0 or position(E'\\' in v_name) > 0 then
    raise exception 'Invalid file name';
  end if;

  if p_kind in ('tool_photo', 'damage_photo') and v_type not in ('image/jpeg', 'image/png', 'image/webp') then
    raise exception 'Only JPEG, PNG or WebP images are allowed';
  end if;
  if p_kind = 'maintenance_attachment'
    and v_type not in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') then
    raise exception 'Maintenance attachments must be an image or PDF';
  end if;

  if p_kind = 'tool_photo' and not exists (
    select 1 from public.tools where id = p_subject_id and company_id = v_company_id
  ) then raise exception 'Tool not found'; end if;
  if p_kind = 'damage_photo' and not exists (
    select 1 from public.damage_reports where id = p_subject_id and company_id = v_company_id
  ) then raise exception 'Damage report not found'; end if;
  if p_kind = 'maintenance_attachment' and not exists (
    select 1 from public.maintenance_events where id = p_subject_id and company_id = v_company_id
  ) then raise exception 'Maintenance event not found'; end if;

  select plan into v_plan from public.companies where id = v_company_id for update;
  if not found then raise exception 'Company not found'; end if;
  v_limit := private.plan_storage_limit(v_plan);

  update public.customer_files
    set status = 'deleted', deleted_at = now()
    where company_id = v_company_id
      and status = 'pending'
      and created_at < now() - interval '1 hour';

  select coalesce(sum(size_bytes), 0) into v_reserved
  from public.customer_files
  where company_id = v_company_id
    and status in ('pending', 'ready');

  if v_reserved + p_size_bytes > v_limit then
    raise exception 'Storage limit reached';
  end if;

  v_object_key := v_company_id::text || '/' || p_kind::text || '/' || v_file_id::text;

  insert into public.customer_files(
    id, company_id, kind, tool_id, damage_report_id, maintenance_event_id,
    object_key, original_name, content_type, size_bytes, created_by_user_id
  ) values (
    v_file_id, v_company_id, p_kind,
    case when p_kind = 'tool_photo' then p_subject_id else null end,
    case when p_kind = 'damage_photo' then p_subject_id else null end,
    case when p_kind = 'maintenance_attachment' then p_subject_id else null end,
    v_object_key, v_name, v_type, p_size_bytes, auth.uid()
  );

  file_id := v_file_id;
  object_key := v_object_key;
  reserved_bytes := v_reserved + p_size_bytes;
  storage_limit_bytes := v_limit;
  return next;
end;
$$;
revoke all on function public.reserve_customer_file(public.customer_file_kind, uuid, text, text, bigint) from public, anon;
grant execute on function public.reserve_customer_file(public.customer_file_kind, uuid, text, text, bigint) to authenticated;

create function public.mark_customer_file_ready(p_file_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_file public.customer_files%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_file from public.customer_files where id = p_file_id for update;
  if not found then raise exception 'File not found'; end if;
  if not private.can_manage_company(v_file.company_id) then raise exception 'Manager access required'; end if;
  if v_file.status <> 'pending' then raise exception 'File is not pending'; end if;
  update public.customer_files set status = 'ready', ready_at = now() where id = p_file_id;
end;
$$;
revoke all on function public.mark_customer_file_ready(uuid) from public, anon;
grant execute on function public.mark_customer_file_ready(uuid) to authenticated;

create function public.abandon_customer_file(p_file_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_file public.customer_files%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_file from public.customer_files where id = p_file_id for update;
  if not found then return; end if;
  if not private.can_manage_company(v_file.company_id) then raise exception 'Manager access required'; end if;
  if v_file.status = 'pending' then
    update public.customer_files set status = 'deleted', deleted_at = now() where id = p_file_id;
  end if;
end;
$$;
revoke all on function public.abandon_customer_file(uuid) from public, anon;
grant execute on function public.abandon_customer_file(uuid) to authenticated;

create function public.delete_customer_file(p_file_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_file public.customer_files%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_file from public.customer_files where id = p_file_id for update;
  if not found then raise exception 'File not found'; end if;
  if not private.can_manage_company(v_file.company_id) then raise exception 'Manager access required'; end if;
  if v_file.status = 'deleted' then return v_file.object_key; end if;
  update public.customer_files set status = 'deleted', deleted_at = now() where id = p_file_id;
  return v_file.object_key;
end;
$$;
revoke all on function public.delete_customer_file(uuid) from public, anon;
grant execute on function public.delete_customer_file(uuid) to authenticated;

create function public.customer_file_usage(p_company_id uuid)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_used bigint;
begin
  if auth.uid() is null or not private.is_active_member(p_company_id) then
    raise exception 'Workspace access required';
  end if;
  select coalesce(sum(size_bytes), 0) into v_used
  from public.customer_files
  where company_id = p_company_id and status in ('pending', 'ready')
    and (status = 'ready' or created_at >= now() - interval '1 hour');
  return v_used;
end;
$$;
revoke all on function public.customer_file_usage(uuid) from public, anon;
grant execute on function public.customer_file_usage(uuid) to authenticated;
