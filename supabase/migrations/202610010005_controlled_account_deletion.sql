-- Preserve operational and audit history while allowing controlled account deletion.

alter table public.tool_transactions
  drop constraint if exists tool_transactions_performed_by_user_id_fkey;
alter table public.tool_transactions
  add constraint tool_transactions_performed_by_user_id_fkey
  foreign key (performed_by_user_id) references auth.users(id) on delete set null;

alter table public.tool_qr_rotations
  alter column rotated_by drop not null,
  drop constraint if exists tool_qr_rotations_rotated_by_fkey;
alter table public.tool_qr_rotations
  add constraint tool_qr_rotations_rotated_by_fkey
  foreign key (rotated_by) references auth.users(id) on delete set null;

alter table public.import_jobs
  alter column user_id drop not null,
  drop constraint if exists import_jobs_user_id_fkey;
alter table public.import_jobs
  add constraint import_jobs_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

alter table public.billing_checkout_intents
  alter column user_id drop not null,
  drop constraint if exists billing_checkout_intents_user_id_fkey;
alter table public.billing_checkout_intents
  add constraint billing_checkout_intents_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

alter table public.billing_plan_change_intents
  alter column user_id drop not null,
  drop constraint if exists billing_plan_change_intents_user_id_fkey;
alter table public.billing_plan_change_intents
  add constraint billing_plan_change_intents_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

alter table public.workspace_invitations
  alter column invited_by drop not null,
  drop constraint if exists workspace_invitations_invited_by_fkey;
alter table public.workspace_invitations
  add constraint workspace_invitations_invited_by_fkey
  foreign key (invited_by) references auth.users(id) on delete set null;

create function public.begin_account_deletion(
  p_user_id uuid,
  p_request_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
begin
  if p_user_id is null or p_request_id is null then
    raise exception 'Invalid deletion request';
  end if;

  if not exists (
    select 1
    from public.privacy_requests r
    where r.id = p_request_id
      and r.requester_user_id = p_user_id
      and r.request_type = 'deletion'
      and r.status = 'pending'
  ) then
    raise exception 'Deletion request not found';
  end if;

  for v_company_id in
    select m.company_id
    from public.organization_members m
    where m.user_id = p_user_id
      and m.role = 'owner'
      and m.status = 'active'
  loop
    perform 1 from public.companies c where c.id = v_company_id for update;

    if not exists (
      select 1
      from public.organization_members other_member
      where other_member.company_id = v_company_id
        and other_member.user_id <> p_user_id
        and other_member.role = 'owner'
        and other_member.status = 'active'
    ) then
      raise exception 'Owner transfer or workspace deletion required';
    end if;
  end loop;

  update public.privacy_requests
  set status = 'in_review'
  where id = p_request_id
    and requester_user_id = p_user_id
    and request_type = 'deletion'
    and status = 'pending';

  if not found then raise exception 'Deletion request not found'; end if;
end;
$$;

revoke all on function public.begin_account_deletion(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.begin_account_deletion(uuid, uuid)
  to service_role;
