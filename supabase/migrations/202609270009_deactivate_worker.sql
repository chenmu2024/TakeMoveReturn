create function private.deactivate_worker_for_company(p_worker_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_company_id uuid;
begin
  select company_id into v_company_id from public.workers where id = p_worker_id for update;
  if not found then return false; end if;
  if not private.can_manage_company(v_company_id) then raise exception 'Forbidden'; end if;
  update public.workers set status = 'inactive', auth_version = auth_version + 1, updated_at = now()
  where id = p_worker_id and status = 'active';
  update public.worker_sessions set revoked_at = coalesce(revoked_at, now())
  where worker_id = p_worker_id;
  return true;
end;
$$;
revoke all on function private.deactivate_worker_for_company(uuid) from public;
grant execute on function private.deactivate_worker_for_company(uuid) to authenticated;

create function public.deactivate_worker(p_worker_id uuid)
returns boolean language sql security invoker set search_path = '' as $$
  select private.deactivate_worker_for_company(p_worker_id);
$$;
revoke all on function public.deactivate_worker(uuid) from public,anon;
grant execute on function public.deactivate_worker(uuid) to authenticated;
