-- Check existing codes in one company without exposing another tenant's register.
create function public.import_existing_asset_codes(p_company_id uuid, p_codes text[])
returns text[] language plpgsql security definer set search_path = '' as $$
declare v_codes text[];
begin
  if auth.uid() is null or not private.can_manage_company(p_company_id) then
    raise exception 'Forbidden';
  end if;
  if p_codes is null or cardinality(p_codes) > 5000
    or exists (select 1 from unnest(p_codes) code where code is null or char_length(code) > 80) then
    raise exception 'Invalid import size';
  end if;
  select coalesce(array_agg(tool.asset_code), array[]::text[]) into v_codes
  from public.tools tool
  where tool.company_id = p_company_id and tool.asset_code = any(p_codes);
  return v_codes;
end;
$$;

revoke all on function public.import_existing_asset_codes(uuid, text[]) from public;
grant execute on function public.import_existing_asset_codes(uuid, text[]) to authenticated;
