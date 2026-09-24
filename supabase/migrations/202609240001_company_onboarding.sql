create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.create_company_for_user(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  clean_name text := btrim(p_name);
  existing_company_id uuid;
  new_company_id uuid;
  slug_base text;
begin
  if actor_id is null then raise exception 'Authentication required'; end if;
  if clean_name is null or char_length(clean_name) < 2 or char_length(clean_name) > 120 then
    raise exception 'Company name must be 2 to 120 characters';
  end if;

  -- Serializing on the authenticated user makes repeated submissions idempotent.
  perform 1 from auth.users where id = actor_id for update;
  if not found then raise exception 'Account not found'; end if;

  select company_id into existing_company_id
  from public.organization_members
  where user_id = actor_id and role = 'owner' and status = 'active'
  order by created_at
  limit 1;
  if existing_company_id is not null then return existing_company_id; end if;

  slug_base := trim(both '-' from regexp_replace(lower(clean_name), '[^a-z0-9]+', '-', 'g'));
  if slug_base = '' then slug_base := 'company'; end if;
  insert into public.companies (name, slug)
  values (clean_name, left(slug_base, 48) || '-' || left(replace(gen_random_uuid()::text, '-', ''), 16))
  returning id into new_company_id;

  insert into public.profiles (id) values (actor_id) on conflict (id) do nothing;
  insert into public.organization_members (company_id, user_id, role)
  values (new_company_id, actor_id, 'owner');

  return new_company_id;
end;
$$;

revoke all on function private.create_company_for_user(text) from public;
grant execute on function private.create_company_for_user(text) to authenticated;

create function public.create_company(p_name text)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.create_company_for_user(p_name);
$$;

revoke all on function public.create_company(text) from public;
grant execute on function public.create_company(text) to authenticated;
