begin;

insert into auth.users (id) values
  ('44444444-4444-4444-8444-444444444444'),
  ('55555555-5555-4555-8555-555555555555');
insert into public.companies (id, name, slug) values
  ('44444444-aaaa-4aaa-8aaa-444444444444', 'QR Tenant A', 'qr-tenant-a'),
  ('55555555-bbbb-4bbb-8bbb-555555555555', 'QR Tenant B', 'qr-tenant-b');
insert into public.organization_members (company_id, user_id, role) values
  ('44444444-aaaa-4aaa-8aaa-444444444444', '44444444-4444-4444-8444-444444444444', 'owner'),
  ('55555555-bbbb-4bbb-8bbb-555555555555', '55555555-5555-4555-8555-555555555555', 'owner');
insert into public.tools (id, company_id, asset_code, qr_token, name) values
  ('44444444-1111-4111-8111-444444444444', '44444444-aaaa-4aaa-8aaa-444444444444', 'QR-A', repeat('a', 64), 'Tenant A tool'),
  ('55555555-2222-4222-8222-555555555555', '55555555-bbbb-4bbb-8bbb-555555555555', 'QR-B', repeat('b', 64), 'Tenant B tool');

set local role anon;
do $$
declare
  payload jsonb;
begin
  if (select count(*) from public.lookup_tool_qr(repeat('a', 64))) <> 1 then
    raise exception 'Anonymous QR lookup failed';
  end if;
  select to_jsonb(lookup) into payload from public.lookup_tool_qr(repeat('a', 64)) lookup;
  if payload ? 'tool_id' or payload ? 'company_id' or payload ? 'qr_token' then
    raise exception 'Anonymous QR lookup exposed internal identifiers';
  end if;
  if (select count(*) from public.lookup_tool_qr('invalid')) <> 0 then
    raise exception 'Malformed QR token was accepted';
  end if;
  begin
    perform public.rotate_tool_qr('44444444-1111-4111-8111-444444444444');
    raise exception 'Anonymous QR rotation unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';
do $$
declare
  rotated text;
begin
  begin
    perform public.rotate_tool_qr('55555555-2222-4222-8222-555555555555');
    raise exception 'Cross-company QR rotation unexpectedly succeeded';
  exception when others then
    if SQLERRM <> 'Forbidden' then raise; end if;
  end;
  rotated := public.rotate_tool_qr('44444444-1111-4111-8111-444444444444');
  if rotated !~ '^[0-9a-f]{64}$' or rotated = repeat('a', 64) then
    raise exception 'QR rotation returned an invalid token';
  end if;
  if (select count(*) from public.lookup_tool_qr(repeat('a', 64))) <> 0 then
    raise exception 'Old QR token remained valid';
  end if;
  if (select count(*) from public.lookup_tool_qr(rotated)) <> 1 then
    raise exception 'New QR token did not resolve';
  end if;
  if (select count(*) from public.tool_qr_rotations where tool_id = '44444444-1111-4111-8111-444444444444') <> 1 then
    raise exception 'QR rotation was not audited';
  end if;
end;
$$;

rollback;
