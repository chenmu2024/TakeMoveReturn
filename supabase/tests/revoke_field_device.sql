begin;

insert into auth.users(id) values ('88888888-8888-4888-8888-888888888888');
insert into public.companies(id,name,slug) values
  ('88888888-aaaa-4aaa-8aaa-888888888888','Device A','device-a'),
  ('99999999-bbbb-4bbb-8bbb-999999999999','Device B','device-b');
insert into public.organization_members(company_id,user_id,role) values
  ('88888888-aaaa-4aaa-8aaa-888888888888','88888888-8888-4888-8888-888888888888','owner');
insert into public.field_device_sessions(id,company_id,device_token_hash,expires_at) values
  ('88888888-1111-4111-8111-888888888888','88888888-aaaa-4aaa-8aaa-888888888888',repeat('d',64),now()+interval '30 days'),
  ('99999999-1111-4111-8111-999999999999','99999999-bbbb-4bbb-8bbb-999999999999',repeat('e',64),now()+interval '30 days');

set local role authenticated;
set local request.jwt.claim.sub = '88888888-8888-4888-8888-888888888888';
do $$ begin
  begin
    update public.field_device_sessions set revoked_at = null
    where id='88888888-1111-4111-8111-888888888888';
    raise exception 'Direct device update was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.revoke_field_device('99999999-1111-4111-8111-999999999999');
    raise exception 'Cross-company device revocation succeeded';
  exception when others then if SQLERRM <> 'Forbidden' then raise; end if;
  end;
  if not public.revoke_field_device('88888888-1111-4111-8111-888888888888') then
    raise exception 'Own device revocation failed';
  end if;
end $$;

reset role;
do $$ begin
  if (select revoked_at from public.field_device_sessions where id='88888888-1111-4111-8111-888888888888') is null
    then raise exception 'Own device remains active'; end if;
  if (select revoked_at from public.field_device_sessions where id='99999999-1111-4111-8111-999999999999') is not null
    then raise exception 'Other company device was revoked'; end if;
end $$;

rollback;
