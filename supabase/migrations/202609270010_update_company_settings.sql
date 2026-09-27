create function private.update_company_settings(p_company_id uuid, p_name text, p_timezone text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_name is null or char_length(btrim(p_name)) not between 2 and 120 then raise exception 'Invalid company name'; end if;
  if p_timezone is null or not exists (
    select 1 from pg_catalog.pg_timezone_names where name = p_timezone
  ) then raise exception 'Invalid timezone'; end if;
  if not exists (
    select 1 from public.organization_members
    where company_id = p_company_id and user_id = auth.uid()
      and status = 'active' and role in ('owner', 'admin')
  ) then raise exception 'Forbidden'; end if;
  update public.companies set name = btrim(p_name), timezone = p_timezone, updated_at = now()
  where id = p_company_id;
  return found;
end;
$$;
revoke all on function private.update_company_settings(uuid,text,text) from public;
grant execute on function private.update_company_settings(uuid,text,text) to authenticated;

create function public.update_company_settings(p_company_id uuid, p_name text, p_timezone text)
returns boolean language sql security invoker set search_path = '' as $$
  select private.update_company_settings(p_company_id,p_name,p_timezone);
$$;
revoke all on function public.update_company_settings(uuid,text,text) from public,anon;
grant execute on function public.update_company_settings(uuid,text,text) to authenticated;
