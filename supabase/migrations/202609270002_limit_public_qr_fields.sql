drop function public.lookup_tool_qr(text);
drop function private.lookup_tool_qr(text);

create function private.lookup_tool_qr(p_token text)
returns table (company_name text, tool_name text, asset_code text)
language sql stable security definer set search_path = '' as $$
  select company.name, tool.name, tool.asset_code
  from public.tools tool
  join public.companies company on company.id = tool.company_id
  where p_token ~ '^[0-9a-f]{64}$' and tool.qr_token = p_token
  limit 1;
$$;
revoke all on function private.lookup_tool_qr(text) from public;
grant execute on function private.lookup_tool_qr(text) to anon, authenticated;

create function public.lookup_tool_qr(p_token text)
returns table (company_name text, tool_name text, asset_code text)
language sql stable security invoker set search_path = '' as $$
  select lookup.company_name, lookup.tool_name, lookup.asset_code
  from private.lookup_tool_qr(p_token) lookup;
$$;
revoke all on function public.lookup_tool_qr(text) from public;
grant execute on function public.lookup_tool_qr(text) to anon, authenticated;
