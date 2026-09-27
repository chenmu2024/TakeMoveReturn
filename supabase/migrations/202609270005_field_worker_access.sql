-- Field credentials are issued only by the server. Neither PIN material nor
-- token hashes are exposed through the anonymous/authenticated Data API.
alter table public.worker_sessions add column session_token_hash text unique;

create table public.field_pin_attempts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  device_session_id uuid not null references public.field_device_sessions(id) on delete cascade,
  worker_auth_version integer not null,
  ip_hash text not null,
  allowed boolean not null,
  succeeded boolean,
  created_at timestamptz not null default now()
);
create index field_pin_attempts_company_time_idx on public.field_pin_attempts(company_id, created_at desc);
create index field_pin_attempts_worker_time_idx on public.field_pin_attempts(worker_id, created_at desc);
create index field_pin_attempts_ip_time_idx on public.field_pin_attempts(ip_hash, created_at desc);
alter table public.field_pin_attempts enable row level security;
revoke all on public.field_pin_attempts from public, anon, authenticated;
revoke all on public.worker_sessions from anon;

create function private.enroll_field_device(p_company_id uuid, p_token_hash text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not private.can_manage_company(p_company_id) then raise exception 'Forbidden'; end if;
  if length(p_token_hash) <> 64 then raise exception 'Invalid device token'; end if;
  insert into public.field_device_sessions(company_id, device_token_hash, expires_at)
  values (p_company_id, p_token_hash, now() + interval '30 days') returning id into v_id;
  return v_id;
end;
$$;
revoke all on function private.enroll_field_device(uuid,text) from public;
grant execute on function private.enroll_field_device(uuid,text) to authenticated;
create function public.enroll_field_device(p_company_id uuid, p_token_hash text)
returns uuid language sql security invoker set search_path = '' as $$
  select private.enroll_field_device(p_company_id,p_token_hash);
$$;
revoke all on function public.enroll_field_device(uuid,text) from public,anon;
grant execute on function public.enroll_field_device(uuid,text) to authenticated;

create function public.begin_field_pin_attempt(p_device_hash text, p_worker_id uuid, p_ip_hash text)
returns table(attempt_id uuid, company_id uuid, worker_id uuid, pin_hash text,
  pin_salt text, pin_iterations integer, pin_version integer)
language plpgsql security definer set search_path = '' as $$
declare v_device public.field_device_sessions; v_worker public.workers;
  v_allowed boolean; v_attempt uuid;
begin
  if length(p_device_hash) <> 64 or length(p_ip_hash) <> 64 then return; end if;
  select * into v_device from public.field_device_sessions
  where device_token_hash = p_device_hash and revoked_at is null and expires_at > now();
  if not found then return; end if;
  select * into v_worker from public.workers
  where id = p_worker_id and company_id = v_device.company_id and status = 'active';
  if not found then return; end if;
  -- Serialize attempts for a company so concurrent guesses cannot evade limits.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_device.company_id::text));
  select
    (select count(*) from public.field_pin_attempts where company_id = v_device.company_id and created_at > now() - interval '15 minutes') < 50
    and (select count(*) from public.field_pin_attempts where worker_id = v_worker.id and created_at > now() - interval '15 minutes' and succeeded is distinct from true) < 5
    and (select count(*) from public.field_pin_attempts where company_id = v_device.company_id and ip_hash = p_ip_hash and created_at > now() - interval '15 minutes') < 15
  into v_allowed;
  insert into public.field_pin_attempts(company_id,worker_id,device_session_id,worker_auth_version,ip_hash,allowed)
  values(v_device.company_id,v_worker.id,v_device.id,v_worker.auth_version,p_ip_hash,v_allowed) returning id into v_attempt;
  if not v_allowed then return; end if;
  return query select v_attempt,v_device.company_id,v_worker.id,v_worker.pin_hash,
    v_worker.pin_salt,v_worker.pin_iterations,v_worker.pin_hash_version;
end;
$$;
revoke all on function public.begin_field_pin_attempt(text,uuid,text) from public,anon,authenticated;
grant execute on function public.begin_field_pin_attempt(text,uuid,text) to service_role;

create function public.complete_field_pin_attempt(p_attempt_id uuid, p_success boolean, p_session_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_attempt public.field_pin_attempts; v_worker public.workers; v_device public.field_device_sessions;
begin
  select * into v_attempt from public.field_pin_attempts where id = p_attempt_id for update;
  if not found or not v_attempt.allowed or v_attempt.succeeded is not null then return false; end if;
  update public.field_pin_attempts set succeeded = p_success where id = p_attempt_id;
  if not p_success then return false; end if;
  if length(p_session_hash) <> 64 then return false; end if;
  select * into v_worker from public.workers where id = v_attempt.worker_id for update;
  select * into v_device from public.field_device_sessions where id = v_attempt.device_session_id for update;
  if v_worker.status <> 'active' or v_worker.auth_version <> v_attempt.worker_auth_version
    or v_worker.company_id <> v_attempt.company_id
    or v_device.company_id <> v_attempt.company_id or v_device.revoked_at is not null
    or v_device.expires_at <= now() then return false; end if;
  insert into public.worker_sessions(company_id,worker_id,device_session_id,worker_auth_version,
    idle_expires_at,absolute_expires_at,session_token_hash)
  values(v_attempt.company_id,v_worker.id,v_device.id,v_worker.auth_version,
    now() + interval '15 minutes',now() + interval '8 hours',p_session_hash);
  return true;
end;
$$;
revoke all on function public.complete_field_pin_attempt(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.complete_field_pin_attempt(uuid,boolean,text) to service_role;

create function public.record_field_tool_transaction(p_session_hash text,p_device_hash text,
  p_qr_token text,p_type public.transaction_type,p_location_id uuid,p_notes text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_session public.worker_sessions; v_device public.field_device_sessions;
  v_worker public.workers; v_tool public.tools; v_id uuid; v_status public.tool_status;
begin
  if p_type not in ('checkout','transfer','return') or length(p_notes) > 500 then raise exception 'Invalid action'; end if;
  select * into v_session from public.worker_sessions where session_token_hash = p_session_hash for update;
  if not found then raise exception 'Session expired'; end if;
  select * into v_device from public.field_device_sessions where id = v_session.device_session_id;
  select * into v_worker from public.workers where id = v_session.worker_id;
  if v_session.revoked_at is not null or v_session.idle_expires_at <= now()
    or v_session.absolute_expires_at <= now() or v_device.device_token_hash <> p_device_hash
    or v_device.revoked_at is not null or v_device.expires_at <= now()
    or v_worker.status <> 'active' or v_worker.auth_version <> v_session.worker_auth_version
    or v_worker.company_id <> v_session.company_id or v_device.company_id <> v_session.company_id
  then raise exception 'Session expired'; end if;
  select * into v_tool from public.tools where qr_token = p_qr_token for update;
  if not found or v_tool.company_id <> v_session.company_id then raise exception 'Tool not found'; end if;
  if not exists (select 1 from public.locations where id = p_location_id
    and company_id = v_session.company_id and active) then raise exception 'Invalid location'; end if;
  if p_type = 'checkout' and v_tool.status = 'available' then v_status := 'checked_out';
  elsif p_type = 'transfer' and v_tool.status in ('available','checked_out') then v_status := 'checked_out';
  elsif p_type = 'return' and v_tool.status = 'checked_out' and v_tool.current_worker_id = v_worker.id then v_status := 'available';
  else raise exception 'Tool state changed or action not permitted'; end if;
  update public.tools set status = v_status,
    current_worker_id = case when p_type = 'return' then null else v_worker.id end,
    current_location_id = p_location_id, revision = revision + 1, updated_at = now()
  where id = v_tool.id;
  insert into public.tool_transactions(company_id,tool_id,transaction_type,from_worker_id,to_worker_id,
    from_location_id,to_location_id,performed_by_worker_id,notes)
  values(v_session.company_id,v_tool.id,p_type,v_tool.current_worker_id,
    case when p_type = 'return' then null else v_worker.id end,
    v_tool.current_location_id,p_location_id,v_worker.id,p_notes) returning id into v_id;
  update public.worker_sessions set last_activity_at = now(),
    idle_expires_at = least(now() + interval '15 minutes', absolute_expires_at)
  where id = v_session.id;
  return v_id;
end;
$$;
revoke all on function public.record_field_tool_transaction(text,text,text,public.transaction_type,uuid,text) from public,anon,authenticated;
grant execute on function public.record_field_tool_transaction(text,text,text,public.transaction_type,uuid,text) to service_role;
