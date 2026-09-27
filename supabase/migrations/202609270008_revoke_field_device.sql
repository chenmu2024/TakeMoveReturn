-- Revocation is one-way for workspace managers; a revoked device cannot be
-- reactivated by editing revoked_at through the Data API.
revoke update (revoked_at) on public.field_device_sessions from authenticated;

create function private.revoke_field_device(p_device_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_company_id uuid;
begin
  select company_id into v_company_id from public.field_device_sessions where id = p_device_id for update;
  if not found then return false; end if;
  if not private.can_manage_company(v_company_id) then raise exception 'Forbidden'; end if;
  update public.field_device_sessions set revoked_at = coalesce(revoked_at, now()) where id = p_device_id;
  update public.worker_sessions set revoked_at = coalesce(revoked_at, now())
  where device_session_id = p_device_id;
  return true;
end;
$$;
revoke all on function private.revoke_field_device(uuid) from public;
grant execute on function private.revoke_field_device(uuid) to authenticated;

create function public.revoke_field_device(p_device_id uuid)
returns boolean language sql security invoker set search_path = '' as $$
  select private.revoke_field_device(p_device_id);
$$;
revoke all on function public.revoke_field_device(uuid) from public,anon;
grant execute on function public.revoke_field_device(uuid) to authenticated;
