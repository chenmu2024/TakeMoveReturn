create table public.legal_acceptances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  terms_accepted_at timestamptz not null,
  privacy_acknowledged_at timestamptz not null
);

alter table public.legal_acceptances enable row level security;

create policy "users read own legal acceptance" on public.legal_acceptances
  for select using (user_id = auth.uid());

create function public.record_signup_legal_acceptance()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.raw_user_meta_data ? 'terms_version'
     and new.raw_user_meta_data ? 'privacy_version' then
    insert into public.legal_acceptances (
      user_id, terms_version, privacy_version, terms_accepted_at, privacy_acknowledged_at
    ) values (
      new.id,
      new.raw_user_meta_data->>'terms_version',
      new.raw_user_meta_data->>'privacy_version',
      now(),
      now()
    );
  end if;
  return new;
end;
$$;

revoke all on function public.record_signup_legal_acceptance() from public, anon, authenticated;

create trigger record_signup_legal_acceptance
  after insert on auth.users
  for each row execute function public.record_signup_legal_acceptance();
