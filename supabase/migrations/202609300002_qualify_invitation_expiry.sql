-- The RETURNS TABLE expires_at output variable must not shadow the table column.
create or replace function public.list_my_workspace_invitations()
returns table (
  invitation_id uuid,
  company_name text,
  role public.member_role,
  expires_at timestamptz
)
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or v_email = '' then raise exception 'Sign in required'; end if;

  update public.workspace_invitations i
    set status = 'expired', updated_at = now()
    where i.status = 'pending' and i.expires_at <= now();

  return query
    select i.id, c.name, i.role, i.expires_at
    from public.workspace_invitations i
    join public.companies c on c.id = i.company_id
    where i.status = 'pending'
      and i.expires_at > now()
      and lower(i.email) = v_email
    order by i.created_at;
end;
$$;

revoke all on function public.list_my_workspace_invitations() from public, anon;
grant execute on function public.list_my_workspace_invitations() to authenticated;
