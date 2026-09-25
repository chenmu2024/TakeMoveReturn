create function private.reset_worker_pin_for_company(
  p_worker_id uuid,
  p_pin_hash text,
  p_pin_salt text,
  p_activate boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_worker public.workers;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into target_worker from public.workers where id = p_worker_id for update;
  if not found then raise exception 'Worker not found'; end if;
  if not private.can_manage_company(target_worker.company_id) then raise exception 'Forbidden'; end if;
  if p_pin_hash is null or p_pin_salt is null
     or octet_length(decode(p_pin_hash, 'base64')) <> 32
     or octet_length(decode(p_pin_salt, 'base64')) < 16 then
    raise exception 'Invalid PIN hash';
  end if;

  update public.workers
  set pin_hash = p_pin_hash,
      pin_salt = p_pin_salt,
      pin_hash_version = 1,
      pin_iterations = 600000,
      auth_version = auth_version + 1,
      status = case when p_activate then 'active' else status end,
      updated_at = now()
  where id = p_worker_id;

  update public.worker_sessions
  set revoked_at = now()
  where worker_id = p_worker_id and revoked_at is null;

  return p_worker_id;
end;
$$;

revoke all on function private.reset_worker_pin_for_company(uuid, text, text, boolean) from public;
grant execute on function private.reset_worker_pin_for_company(uuid, text, text, boolean) to authenticated;

create function public.reset_worker_pin(
  p_worker_id uuid,
  p_pin_hash text,
  p_pin_salt text,
  p_activate boolean default false
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.reset_worker_pin_for_company(p_worker_id, p_pin_hash, p_pin_salt, p_activate);
$$;

revoke all on function public.reset_worker_pin(uuid, text, text, boolean) from public, anon;
grant execute on function public.reset_worker_pin(uuid, text, text, boolean) to authenticated;
