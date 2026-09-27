-- A reset or revoked device after PIN verification is a failed sign-in, not
-- a successful one. Keep the audit and the worker limiter in agreement.
create or replace function public.complete_field_pin_attempt(p_attempt_id uuid, p_success boolean, p_session_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_attempt public.field_pin_attempts; v_worker public.workers; v_device public.field_device_sessions;
begin
  select * into v_attempt from public.field_pin_attempts where id = p_attempt_id for update;
  if not found or not v_attempt.allowed or v_attempt.succeeded is not null then return false; end if;
  if not p_success or length(p_session_hash) <> 64 then
    update public.field_pin_attempts set succeeded = false where id = p_attempt_id;
    return false;
  end if;
  select * into v_worker from public.workers where id = v_attempt.worker_id for update;
  select * into v_device from public.field_device_sessions where id = v_attempt.device_session_id for update;
  if v_worker.status <> 'active' or v_worker.auth_version <> v_attempt.worker_auth_version
    or v_worker.company_id <> v_attempt.company_id or v_device.company_id <> v_attempt.company_id
    or v_device.revoked_at is not null or v_device.expires_at <= now() then
    update public.field_pin_attempts set succeeded = false where id = p_attempt_id;
    return false;
  end if;
  insert into public.worker_sessions(company_id,worker_id,device_session_id,worker_auth_version,
    idle_expires_at,absolute_expires_at,session_token_hash)
  values(v_attempt.company_id,v_worker.id,v_device.id,v_worker.auth_version,
    now() + interval '15 minutes',now() + interval '8 hours',p_session_hash);
  update public.field_pin_attempts set succeeded = true where id = p_attempt_id;
  return true;
end;
$$;
