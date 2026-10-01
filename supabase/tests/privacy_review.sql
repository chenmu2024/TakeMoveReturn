begin;
insert into public.privacy_requests(id, request_type)
values ('abcdefab-0000-4000-8000-000000000001', 'access');

set local role authenticated;
do $$
begin
  begin
    perform public.review_privacy_request('abcdefab-0000-4000-8000-000000000001', 'pending', 'in_review', 'QA operator', 'QA evidence', 'Review started');
    raise exception 'Authenticated user can review requests';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
set local role service_role;
select public.review_privacy_request('abcdefab-0000-4000-8000-000000000001', 'pending', 'in_review', 'QA operator', 'QA evidence', 'Review started');
do $$
begin
  begin
    perform public.review_privacy_request('abcdefab-0000-4000-8000-000000000001', 'pending', 'completed', 'QA operator', 'QA evidence', 'Access delivered');
    raise exception 'Stale review succeeded';
  exception when raise_exception then
    if sqlerrm <> 'Request changed; reload before reviewing' then raise; end if;
  end;
end;
$$;
select public.review_privacy_request('abcdefab-0000-4000-8000-000000000001', 'in_review', 'completed', 'QA operator', 'QA delivery evidence', 'Access delivered');
do $$
begin
  if (select count(*) from public.privacy_request_reviews where request_id = 'abcdefab-0000-4000-8000-000000000001') <> 2
    or not exists (select 1 from public.privacy_requests where id = 'abcdefab-0000-4000-8000-000000000001' and status = 'completed' and completed_at is not null) then
    raise exception 'Review audit or completion missing';
  end if;
  begin
    delete from public.privacy_request_reviews;
    raise exception 'Operator can delete audit';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
