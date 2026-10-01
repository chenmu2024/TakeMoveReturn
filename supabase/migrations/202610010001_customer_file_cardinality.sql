-- Enforce customer-file cardinality and file-size rules inside the same
-- company-row lock already used for storage quota reservations.
-- This makes the 1 / 3 / 3 attachment rules safe under concurrent uploads.

create or replace function public.reserve_customer_file(
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
  v_subject_count integer;
  v_subject_limit integer;
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
  if p_size_bytes is null or p_size_bytes < 1 then
    raise exception 'File size must be at least 1 byte';
  end if;
  if p_kind in ('tool_photo', 'damage_photo') and p_size_bytes > 5242880 then
    raise exception 'Image file size must not exceed 5 MB';
  end if;
  if p_kind = 'maintenance_attachment' and p_size_bytes > 10485760 then
    raise exception 'Maintenance attachment must not exceed 10 MB';
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

  -- Serializes quota and cardinality reservations for this workspace.
  select plan into v_plan from public.companies where id = v_company_id for update;
  if not found then raise exception 'Company not found'; end if;
  v_limit := private.plan_storage_limit(v_plan);

  update public.customer_files
    set status = 'deleted', deleted_at = now()
    where company_id = v_company_id
      and status = 'pending'
      and created_at < now() - interval '1 hour';

  v_subject_limit := case p_kind
    when 'tool_photo' then 1
    when 'damage_photo' then 3
    when 'maintenance_attachment' then 3
  end;

  select count(*) into v_subject_count
  from public.customer_files cf
  where cf.company_id = v_company_id
    and cf.kind = p_kind
    and cf.status in ('pending', 'ready')
    and (
      (p_kind = 'tool_photo' and cf.tool_id = p_subject_id)
      or (p_kind = 'damage_photo' and cf.damage_report_id = p_subject_id)
      or (p_kind = 'maintenance_attachment' and cf.maintenance_event_id = p_subject_id)
    );

  if v_subject_count >= v_subject_limit then
    raise exception 'Attachment limit reached';
  end if;

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
