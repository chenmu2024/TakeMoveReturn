-- Custody and history may only be changed by validated transaction functions.
revoke insert on public.tools from public, anon, authenticated;
revoke update on public.tools from public, anon, authenticated;
grant update (name, category, brand, model, serial_number, description, notes)
  on public.tools to authenticated;

revoke insert on public.tool_transactions from public, anon, authenticated;

-- PIN material and device tokens must never be returned by the Data API.
revoke select on public.workers from public, anon, authenticated;
grant select (id, company_id, name, phone, employee_code, status, created_at, updated_at)
  on public.workers to authenticated;
revoke insert on public.workers from public, anon, authenticated;
revoke update on public.workers from public, anon, authenticated;
grant update (name, phone, employee_code, status) on public.workers to authenticated;

revoke select on public.field_device_sessions from public, anon, authenticated;
grant select (id, company_id, created_at, last_seen_at, expires_at, revoked_at)
  on public.field_device_sessions to authenticated;
revoke update on public.field_device_sessions from public, anon, authenticated;
grant update (revoked_at) on public.field_device_sessions to authenticated;

revoke select on public.worker_sessions from public, anon, authenticated;
grant select (id, company_id, worker_id, device_session_id, created_at,
  last_activity_at, idle_expires_at, absolute_expires_at, revoked_at)
  on public.worker_sessions to authenticated;
revoke update on public.worker_sessions from public, anon, authenticated;
grant update (revoked_at) on public.worker_sessions to authenticated;

-- Existing helper functions use schema-qualified relations and must not resolve
-- any caller-controlled objects through the search path.
alter function public.is_active_member(uuid) set search_path = '';
alter function public.can_manage_company(uuid) set search_path = '';
alter function public.is_valid_worker_session(uuid, uuid) set search_path = '';
alter function public.record_tool_transaction(uuid, public.transaction_type, uuid, uuid, text)
  set search_path = '';
