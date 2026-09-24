create function private.create_tool_for_company(
  p_company_id uuid,
  p_asset_code text,
  p_name text,
  p_category text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  company_plan text;
  tool_limit integer;
  active_count integer;
  new_tool_id uuid;
  clean_code text := btrim(p_asset_code);
  clean_name text := btrim(p_name);
  clean_category text := nullif(btrim(p_category), '');
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if clean_code is null or char_length(clean_code) < 1 or char_length(clean_code) > 80 then
    raise exception 'Asset code must be 1 to 80 characters';
  end if;
  if clean_name is null or char_length(clean_name) < 2 or char_length(clean_name) > 120 then
    raise exception 'Tool name must be 2 to 120 characters';
  end if;
  if clean_category is not null and char_length(clean_category) > 80 then
    raise exception 'Category must be 80 characters or fewer';
  end if;

  -- The company row lock serializes concurrent creates against the same plan.
  select plan into company_plan from public.companies where id = p_company_id for update;
  if not found then raise exception 'Company not found'; end if;
  if not private.can_manage_company(p_company_id) then raise exception 'Forbidden'; end if;

  tool_limit := case company_plan
    when 'free' then 25
    when 'starter' then 200
    when 'growth' then 600
    when 'pro' then 2000
    else 0
  end;
  select count(*) into active_count from public.tools
  where company_id = p_company_id and status <> 'retired';
  if active_count >= tool_limit then raise exception 'Tool limit reached'; end if;

  insert into public.tools (company_id, asset_code, qr_token, name, category)
  values (
    p_company_id,
    clean_code,
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
    clean_name,
    clean_category
  ) returning id into new_tool_id;
  return new_tool_id;
end;
$$;

revoke all on function private.create_tool_for_company(uuid, text, text, text) from public;
grant execute on function private.create_tool_for_company(uuid, text, text, text) to authenticated;

create function public.create_tool(
  p_company_id uuid,
  p_asset_code text,
  p_name text,
  p_category text default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.create_tool_for_company(p_company_id, p_asset_code, p_name, p_category);
$$;

revoke all on function public.create_tool(uuid, text, text, text) from public;
grant execute on function public.create_tool(uuid, text, text, text) to authenticated;
