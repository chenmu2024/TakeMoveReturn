-- OUT columns of a TABLE-returning PL/pgSQL function are variables. Qualify
-- relation columns so the limiter cannot resolve a company ID ambiguously.
create or replace function public.begin_field_pin_attempt(p_device_hash text, p_worker_id uuid, p_ip_hash text)
returns table(attempt_id uuid, company_id uuid, worker_id uuid, pin_hash text,
  pin_salt text, pin_iterations integer, pin_version integer)
language plpgsql security definer set search_path = '' as $$
declare v_device public.field_device_sessions; v_worker public.workers;
  v_allowed boolean; v_attempt uuid;
begin
  if length(p_device_hash) <> 64 or length(p_ip_hash) <> 64 then return; end if;
  select * into v_device from public.field_device_sessions d
  where d.device_token_hash = p_device_hash and d.revoked_at is null and d.expires_at > now();
  if not found then return; end if;
  select * into v_worker from public.workers w
  where w.id = p_worker_id and w.company_id = v_device.company_id and w.status = 'active';
  if not found then return; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_device.company_id::text));
  select
    (select count(*) from public.field_pin_attempts a where a.company_id = v_device.company_id and a.created_at > now() - interval '15 minutes') < 50
    and (select count(*) from public.field_pin_attempts a where a.worker_id = v_worker.id and a.created_at > now() - interval '15 minutes' and a.succeeded is distinct from true) < 5
    and (select count(*) from public.field_pin_attempts a where a.company_id = v_device.company_id and a.ip_hash = p_ip_hash and a.created_at > now() - interval '15 minutes') < 15
  into v_allowed;
  insert into public.field_pin_attempts(company_id,worker_id,device_session_id,worker_auth_version,ip_hash,allowed)
  values(v_device.company_id,v_worker.id,v_device.id,v_worker.auth_version,p_ip_hash,v_allowed) returning id into v_attempt;
  if not v_allowed then return; end if;
  return query select v_attempt,v_device.company_id,v_worker.id,v_worker.pin_hash,
    v_worker.pin_salt,v_worker.pin_iterations,v_worker.pin_hash_version;
end;
$$;
