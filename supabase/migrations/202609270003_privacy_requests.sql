create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  requester_user_id uuid references auth.users(id) on delete set null,
  request_type text not null check (request_type in ('access', 'export', 'rectification', 'deletion', 'restriction')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'pending' check (status in ('pending', 'in_review', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index privacy_requests_one_open_per_type on public.privacy_requests
  (company_id, requester_user_id, request_type)
  where status in ('pending', 'in_review');

create index privacy_requests_user_created on public.privacy_requests
  (requester_user_id, created_at desc);

alter table public.privacy_requests enable row level security;

create policy "users read own privacy requests" on public.privacy_requests
  for select to authenticated
  using (requester_user_id = (select auth.uid()));

create policy "active members create own privacy requests" on public.privacy_requests
  for insert to authenticated
  with check (
    requester_user_id = (select auth.uid())
    and status = 'pending'
    and completed_at is null
    and public.is_active_member(company_id)
  );

revoke all on public.privacy_requests from anon;
grant select, insert on public.privacy_requests to authenticated;
