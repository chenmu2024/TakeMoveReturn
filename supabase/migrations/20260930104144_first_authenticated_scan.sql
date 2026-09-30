-- Existing workspaces start measurement when this release is applied; new
-- workspaces start at creation. Historical QR opens cannot be reconstructed.
alter table public.companies add column activation_started_at timestamptz not null default now();

create table public.first_authenticated_scans (
  company_id uuid primary key references public.companies(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete restrict,
  worker_id uuid not null references public.workers(id) on delete restrict,
  scanned_at timestamptz not null default now()
);
alter table public.first_authenticated_scans enable row level security;
revoke all on public.first_authenticated_scans from public,anon,authenticated;
grant select on public.first_authenticated_scans to authenticated;
create policy "managers read first authenticated scan" on public.first_authenticated_scans
  for select to authenticated using (public.can_manage_company(company_id));

create function public.record_first_authenticated_scan(p_session_hash text,p_device_hash text,p_qr_token text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_session public.worker_sessions; v_tool public.tools;
begin
  if length(p_session_hash) <> 64 or length(p_device_hash) <> 64 or length(p_qr_token) <> 64 then return false; end if;
  select session.* into v_session from public.worker_sessions session
    join public.field_device_sessions device on device.id = session.device_session_id
    where session.session_token_hash = p_session_hash and device.device_token_hash = p_device_hash;
  if not found or not public.is_valid_worker_session(v_session.id,v_session.company_id) then return false; end if;
  select * into v_tool from public.tools where qr_token = p_qr_token and company_id = v_session.company_id;
  if not found then return false; end if;
  insert into public.first_authenticated_scans(company_id,tool_id,worker_id)
    values(v_session.company_id,v_tool.id,v_session.worker_id) on conflict (company_id) do nothing;
  return true;
end;
$$;
revoke all on function public.record_first_authenticated_scan(text,text,text) from public,anon,authenticated;
grant execute on function public.record_first_authenticated_scan(text,text,text) to service_role;
