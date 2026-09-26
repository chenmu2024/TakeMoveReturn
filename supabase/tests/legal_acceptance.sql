begin;

insert into auth.users (id, raw_user_meta_data) values
  ('33333333-3333-4333-8333-333333333333', '{"terms_version":"2026-09-25","privacy_version":"2026-09-25"}'::jsonb);

do $$
begin
  if (select count(*) from public.legal_acceptances
      where user_id = '33333333-3333-4333-8333-333333333333'::uuid
        and terms_version = '2026-09-25'
        and privacy_version = '2026-09-25'
        and terms_accepted_at is not null
        and privacy_acknowledged_at is not null) <> 1 then
    raise exception 'Signup legal acceptance was not recorded';
  end if;
end;
$$;

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';

do $$
begin
  if (select count(*) from public.legal_acceptances) <> 1 then
    raise exception 'Own acceptance is not readable';
  end if;
end;
$$;

rollback;
