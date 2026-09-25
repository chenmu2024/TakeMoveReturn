create function private.create_worker_for_company(
  p_company_id uuid,
  p_name text,
  p_phone text,
  p_employee_code text,
  p_pin_hash text,
  p_pin_salt text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_worker_id uuid;
  clean_name text := btrim(p_name);
  clean_phone text := nullif(btrim(p_phone), '');
  clean_code text := nullif(btrim(p_employee_code), '');
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not private.can_manage_company(p_company_id) then raise exception 'Forbidden'; end if;
  if clean_name is null or char_length(clean_name) < 2 or char_length(clean_name) > 120 then
    raise exception 'Worker name must be 2 to 120 characters';
  end if;
  if clean_phone is not null and char_length(clean_phone) > 40 then
    raise exception 'Phone must be 40 characters or fewer';
  end if;
  if clean_code is not null and char_length(clean_code) > 80 then
    raise exception 'Employee code must be 80 characters or fewer';
  end if;
  if p_pin_hash is null or p_pin_salt is null
     or octet_length(decode(p_pin_hash, 'base64')) <> 32
     or octet_length(decode(p_pin_salt, 'base64')) < 16 then
    raise exception 'Invalid PIN hash';
  end if;

  insert into public.workers (
    company_id, name, phone, employee_code, pin_hash, pin_salt,
    pin_hash_version, pin_iterations
  ) values (
    p_company_id, clean_name, clean_phone, clean_code, p_pin_hash, p_pin_salt,
    1, 600000
  ) returning id into new_worker_id;
  return new_worker_id;
end;
$$;

revoke all on function private.create_worker_for_company(uuid, text, text, text, text, text) from public;
grant execute on function private.create_worker_for_company(uuid, text, text, text, text, text) to authenticated;

create function public.create_worker(
  p_company_id uuid,
  p_name text,
  p_phone text,
  p_employee_code text,
  p_pin_hash text,
  p_pin_salt text
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.create_worker_for_company(p_company_id, p_name, p_phone, p_employee_code, p_pin_hash, p_pin_salt);
$$;

revoke all on function public.create_worker(uuid, text, text, text, text, text) from public;
grant execute on function public.create_worker(uuid, text, text, text, text, text) to authenticated;
