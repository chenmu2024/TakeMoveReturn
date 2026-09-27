begin;

insert into auth.users (id, raw_user_meta_data) values
  ('33333333-3333-4333-8333-333333333333', '{"terms_version":"2026-09-28","privacy_version":"2026-09-28"}'::jsonb),
  ('44444444-4444-4444-8444-444444444444', '{}'::jsonb);

do $$
begin
  if (select count(*) from public.legal_acceptances
      where user_id = '33333333-3333-4333-8333-333333333333'::uuid
        and terms_version = '2026-09-28'
        and privacy_version = '2026-09-28'
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

insert into public.legal_acceptances (user_id, terms_version, privacy_version, terms_accepted_at, privacy_acknowledged_at)
values ('33333333-3333-4333-8333-333333333333', '2026-09-28', '2026-09-28', now(), now())
on conflict (user_id) do update set terms_version = excluded.terms_version,
  privacy_version = excluded.privacy_version, terms_accepted_at = excluded.terms_accepted_at,
  privacy_acknowledged_at = excluded.privacy_acknowledged_at;

do $$
begin
  begin
    insert into public.legal_acceptances (user_id, terms_version, privacy_version, terms_accepted_at, privacy_acknowledged_at)
    values ('44444444-4444-4444-8444-444444444444', '2026-09-28', '2026-09-28', now(), now());
    raise exception 'Cross-account legal acceptance was allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
