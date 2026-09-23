create table public.field_device_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  device_token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create table public.worker_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  device_session_id uuid not null references public.field_device_sessions(id) on delete cascade,
  worker_auth_version integer not null,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  idle_expires_at timestamptz not null,
  absolute_expires_at timestamptz not null,
  revoked_at timestamptz,
  check (idle_expires_at <= absolute_expires_at)
);

create index worker_sessions_active_idx on public.worker_sessions(company_id, worker_id)
  where revoked_at is null;
create index field_device_sessions_active_idx on public.field_device_sessions(company_id)
  where revoked_at is null;

create or replace function public.is_valid_worker_session(target_session_id uuid, target_company_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.worker_sessions session
    join public.workers worker on worker.id = session.worker_id
    join public.field_device_sessions device on device.id = session.device_session_id
    where session.id = target_session_id
      and session.company_id = target_company_id
      and worker.company_id = target_company_id
      and device.company_id = target_company_id
      and worker.status = 'active'
      and worker.auth_version = session.worker_auth_version
      and session.revoked_at is null
      and device.revoked_at is null
      and session.idle_expires_at > now()
      and session.absolute_expires_at > now()
      and device.expires_at > now()
  );
$$;

alter table public.field_device_sessions enable row level security;
alter table public.worker_sessions enable row level security;

create policy "members read device sessions" on public.field_device_sessions
  for select using (public.is_active_member(company_id));
create policy "members read worker sessions" on public.worker_sessions
  for select using (public.is_active_member(company_id));
create policy "managers revoke device sessions" on public.field_device_sessions
  for update using (public.can_manage_company(company_id))
  with check (public.can_manage_company(company_id));
create policy "managers revoke worker sessions" on public.worker_sessions
  for update using (public.can_manage_company(company_id))
  with check (public.can_manage_company(company_id));
