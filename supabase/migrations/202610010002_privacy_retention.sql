-- Privacy fulfilment and retention cleanup.
-- Account closure pseudonymizes sign-in identity while retaining non-PII business audit history.

create or replace function public.fulfill_account_deletion(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_company uuid;
begin
  if p_user_id is null then raise exception 'User required'; end if;

  -- Do not orphan an active workspace. A sole owner must first arrange workspace closure/ownership.
  for v_company in
    select company_id from public.organization_members
    where user_id = p_user_id and status = 'active' and role = 'owner'
  loop
    if not exists (
      select 1 from public.organization_members
      where company_id = v_company and status = 'active' and role = 'owner' and user_id <> p_user_id
    ) then
      raise exception 'Sole owner cannot close account while workspace is active';
    end if;
  end loop;

  update public.profiles
    set display_name = 'Deleted User', updated_at = pg_catalog.now()
    where id = p_user_id;

  update public.organization_members
    set status = 'inactive', updated_at = pg_catalog.now()
    where user_id = p_user_id and status = 'active';

  update public.privacy_requests
    set status = 'completed', completed_at = coalesce(completed_at, pg_catalog.now())
    where requester_user_id = p_user_id and request_type = 'deletion'
      and status in ('pending','in_review');

  if not exists (
    select 1 from public.privacy_requests
    where requester_user_id = p_user_id and request_type = 'deletion'
  ) then
    insert into public.privacy_requests(
      company_id,requester_user_id,request_type,details,status,completed_at
    )
    select m.company_id,p_user_id,'deletion','Self-service account closure','completed',pg_catalog.now()
    from public.organization_members m
    where m.user_id = p_user_id
    order by m.created_at
    limit 1;
  end if;

  return true;
end;
$$;
revoke all on function public.fulfill_account_deletion(uuid) from public,anon,authenticated;
grant execute on function public.fulfill_account_deletion(uuid) to service_role;

create or replace function public.run_retention_cleanup()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_pin_attempts integer := 0;
  v_access_audit integer := 0;
  v_privacy_requests integer := 0;
begin
  delete from public.field_pin_attempts
    where created_at < pg_catalog.now() - interval '180 days';
  get diagnostics v_pin_attempts = row_count;

  delete from public.workspace_access_audit
    where created_at < pg_catalog.now() - interval '180 days';
  get diagnostics v_access_audit = row_count;

  delete from public.privacy_requests
    where status in ('completed','rejected')
      and coalesce(completed_at,created_at) < pg_catalog.now() - interval '24 months';
  get diagnostics v_privacy_requests = row_count;

  return jsonb_build_object(
    'field_pin_attempts',v_pin_attempts,
    'workspace_access_audit',v_access_audit,
    'privacy_requests',v_privacy_requests
  );
end;
$$;
revoke all on function public.run_retention_cleanup() from public,anon,authenticated;
grant execute on function public.run_retention_cleanup() to service_role;
