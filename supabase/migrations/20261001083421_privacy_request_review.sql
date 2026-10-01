-- Operator-only review, with an immutable history and a requester-visible outcome.
alter table public.privacy_requests add column response_summary text
  check (char_length(response_summary) <= 1000);
drop policy "active members create own privacy requests" on public.privacy_requests;
create policy "active members create own privacy requests" on public.privacy_requests
  for insert to authenticated with check (
    requester_user_id = (select auth.uid()) and status = 'pending'
    and completed_at is null and response_summary is null
    and public.is_active_member(company_id)
  );

create table public.privacy_request_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.privacy_requests(id) on delete cascade,
  previous_status text not null,
  status text not null,
  operator_reference text not null check (char_length(operator_reference) between 3 and 120),
  evidence_reference text not null check (char_length(evidence_reference) between 3 and 500),
  response_summary text not null check (char_length(response_summary) between 3 and 1000),
  created_at timestamptz not null default now()
);
create index privacy_request_reviews_request on public.privacy_request_reviews(request_id, created_at);
alter table public.privacy_request_reviews enable row level security;
revoke all on public.privacy_request_reviews from public, anon, authenticated, service_role;
grant select, insert on public.privacy_request_reviews to service_role;
grant select, update on public.privacy_requests to service_role;

create function public.review_privacy_request(
  p_request_id uuid, p_expected_status text, p_status text,
  p_operator_reference text, p_evidence_reference text, p_response_summary text
) returns void language plpgsql security invoker set search_path = '' as $$
declare v_status text;
begin
  select status into v_status from public.privacy_requests where id = p_request_id for update;
  if not found then raise exception 'Request not found'; end if;
  if v_status <> p_expected_status then raise exception 'Request changed; reload before reviewing'; end if;
  if not ((v_status = 'pending' and p_status = 'in_review')
    or (v_status = 'in_review' and p_status in ('completed', 'rejected'))) then
    raise exception 'Invalid review transition';
  end if;
  insert into public.privacy_request_reviews
    (request_id, previous_status, status, operator_reference, evidence_reference, response_summary)
    values (p_request_id, v_status, p_status, trim(p_operator_reference), trim(p_evidence_reference), trim(p_response_summary));
  update public.privacy_requests set status = p_status,
    response_summary = trim(p_response_summary),
    completed_at = case when p_status in ('completed', 'rejected') then now() else null end
    where id = p_request_id;
end;
$$;
revoke all on function public.review_privacy_request(uuid,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.review_privacy_request(uuid,text,text,text,text,text) to service_role;
