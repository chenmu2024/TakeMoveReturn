create table public.tool_qr_rotations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  rotated_by uuid not null references auth.users(id),
  rotated_at timestamptz not null default now()
);

alter table public.tool_qr_rotations enable row level security;
revoke all on public.tool_qr_rotations from public, anon, authenticated;
grant select on public.tool_qr_rotations to authenticated;
create policy "owners and admins read QR rotations" on public.tool_qr_rotations
  for select to authenticated using (exists (
    select 1 from public.organization_members member
    where member.company_id = tool_qr_rotations.company_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin')
  ));

create function private.lookup_tool_qr(p_token text)
returns table (tool_id uuid, company_id uuid, company_name text, tool_name text, asset_code text)
language sql stable security definer set search_path = '' as $$
  select tool.id, company.id, company.name, tool.name, tool.asset_code
  from public.tools tool
  join public.companies company on company.id = tool.company_id
  where p_token ~ '^[0-9a-f]{64}$' and tool.qr_token = p_token
  limit 1;
$$;
revoke all on function private.lookup_tool_qr(text) from public;
grant execute on function private.lookup_tool_qr(text) to anon, authenticated;

create function public.lookup_tool_qr(p_token text)
returns table (tool_id uuid, company_id uuid, company_name text, tool_name text, asset_code text)
language sql stable security invoker set search_path = '' as $$
  select * from private.lookup_tool_qr(p_token);
$$;
revoke all on function public.lookup_tool_qr(text) from public;
grant execute on function public.lookup_tool_qr(text) to anon, authenticated;

create function private.rotate_tool_qr_for_company(p_tool_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  target_tool public.tools;
  new_token text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into target_tool from public.tools where id = p_tool_id for update;
  if not found then raise exception 'Tool not found'; end if;
  if not exists (
    select 1 from public.organization_members member
    where member.company_id = target_tool.company_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin')
  ) then raise exception 'Forbidden'; end if;

  new_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  update public.tools set qr_token = new_token, updated_at = now() where id = p_tool_id;
  insert into public.tool_qr_rotations (company_id, tool_id, rotated_by)
  values (target_tool.company_id, p_tool_id, auth.uid());
  return new_token;
end;
$$;
revoke all on function private.rotate_tool_qr_for_company(uuid) from public;
grant execute on function private.rotate_tool_qr_for_company(uuid) to authenticated;

create function public.rotate_tool_qr(p_tool_id uuid)
returns text language sql security invoker set search_path = '' as $$
  select private.rotate_tool_qr_for_company(p_tool_id);
$$;
revoke all on function public.rotate_tool_qr(uuid) from public, anon;
grant execute on function public.rotate_tool_qr(uuid) to authenticated;
