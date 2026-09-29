create or replace function private.plan_admin_limit(p_plan text)
returns integer language sql immutable set search_path = '' as $$
  select case p_plan
    when 'free' then 1
    when 'starter' then 2
    when 'growth' then 5
    when 'pro' then 10
    else 0
  end;
$$;

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role public.member_role not null check (role in ('admin', 'manager')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid not null references auth.users(id) on delete restrict,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email = lower(btrim(email))),
  check (char_length(email) between 3 and 254)
);

create unique index workspace_invitations_one_pending_email_idx
  on public.workspace_invitations(company_id, lower(email))
  where status = 'pending';

create index workspace_invitations_invitee_idx
  on public.workspace_invitations(lower(email), status, expires_at);

create table public.workspace_access_audit (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  subject_user_id uuid references auth.users(id) on delete set null,
  invitation_id uuid references public.workspace_invitations(id) on delete set null,
  event_type text not null check (event_type in (
    'invitation_created',
    'invitation_revoked',
    'invitation_accepted',
    'member_role_changed',
    'member_deactivated',
    'member_reactivated'
  )),
  old_role public.member_role,
  new_role public.member_role,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index workspace_access_audit_company_created_idx
  on public.workspace_access_audit(company_id, created_at desc);

alter table public.workspace_invitations enable row level security;
alter table public.workspace_access_audit enable row level security;

create policy "owners read workspace invitations" on public.workspace_invitations
for select to authenticated using (
  exists (
    select 1 from public.organization_members m
    where m.company_id = workspace_invitations.company_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
      and m.status = 'active'
  )
  or (
    status = 'pending'
    and expires_at > now()
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

create policy "owners and admins read access audit" on public.workspace_access_audit
for select to authenticated using (
  exists (
    select 1 from public.organization_members m
    where m.company_id = workspace_access_audit.company_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
      and m.status = 'active'
  )
);

revoke all on public.workspace_invitations, public.workspace_access_audit from public, anon, authenticated;
grant select on public.workspace_invitations, public.workspace_access_audit to authenticated;

create function public.list_workspace_members(p_company_id uuid)
returns table (
  user_id uuid,
  email text,
  role public.member_role,
  status text,
  created_at timestamptz
)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.organization_members requester
    where requester.company_id = p_company_id
      and requester.user_id = auth.uid()
      and requester.status = 'active'
      and requester.role in ('owner', 'admin')
  ) then
    raise exception 'Owner or admin access required';
  end if;

  return query
    select m.user_id, lower(coalesce(u.email, ''))::text, m.role, m.status, m.created_at
    from public.organization_members m
    join auth.users u on u.id = m.user_id
    where m.company_id = p_company_id
    order by
      case m.role when 'owner' then 0 when 'admin' then 1 else 2 end,
      m.created_at;
end;
$$;

revoke all on function public.list_workspace_members(uuid) from public, anon;
grant execute on function public.list_workspace_members(uuid) to authenticated;

create function public.list_my_workspace_invitations()
returns table (
  invitation_id uuid,
  company_name text,
  role public.member_role,
  expires_at timestamptz
)
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or v_email = '' then raise exception 'Sign in required'; end if;

  update public.workspace_invitations
    set status = 'expired', updated_at = now()
    where status = 'pending' and expires_at <= now();

  return query
    select i.id, c.name, i.role, i.expires_at
    from public.workspace_invitations i
    join public.companies c on c.id = i.company_id
    where i.status = 'pending'
      and i.expires_at > now()
      and lower(i.email) = v_email
    order by i.created_at;
end;
$$;

revoke all on function public.list_my_workspace_invitations() from public, anon;
grant execute on function public.list_my_workspace_invitations() to authenticated;

create function public.create_workspace_invitation(
  p_company_id uuid,
  p_email text,
  p_role public.member_role
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(btrim(p_email));
  v_plan text;
  v_limit integer;
  v_active integer;
  v_pending integer;
  v_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.organization_members m
    where m.company_id = p_company_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
      and m.status = 'active'
  ) then raise exception 'Owner access required'; end if;

  if p_role not in ('admin', 'manager') then raise exception 'Invalid member role'; end if;
  if char_length(v_email) < 3 or char_length(v_email) > 254
    or position('@' in v_email) <= 1 then raise exception 'Invalid email'; end if;

  if not exists (
    select 1 from public.legal_acceptances a
    where a.user_id = auth.uid()
      and a.terms_version = '2026-09-28'
      and a.privacy_version = '2026-09-28'
  ) then raise exception 'Current terms acceptance required'; end if;

  select plan into v_plan from public.companies where id = p_company_id for update;
  if not found then raise exception 'Company not found'; end if;
  v_limit := private.plan_admin_limit(v_plan);

  update public.workspace_invitations
    set status = 'expired', updated_at = now()
    where company_id = p_company_id and status = 'pending' and expires_at <= now();

  if exists (
    select 1 from public.organization_members m
    join auth.users u on u.id = m.user_id
    where m.company_id = p_company_id
      and m.status = 'active'
      and lower(coalesce(u.email, '')) = v_email
  ) then raise exception 'User is already an active member'; end if;

  if exists (
    select 1 from public.workspace_invitations i
    where i.company_id = p_company_id and i.status = 'pending'
      and i.expires_at > now() and lower(i.email) = v_email
  ) then raise exception 'Invitation already pending'; end if;

  select count(*) into v_active from public.organization_members
    where company_id = p_company_id and status = 'active';
  select count(*) into v_pending from public.workspace_invitations
    where company_id = p_company_id and status = 'pending' and expires_at > now();

  if v_active + v_pending >= v_limit then raise exception 'Admin limit reached'; end if;

  insert into public.workspace_invitations(company_id,email,role,invited_by)
    values(p_company_id,v_email,p_role,auth.uid())
    returning id into v_id;

  insert into public.workspace_access_audit(company_id,actor_user_id,invitation_id,event_type,new_role,metadata)
    values(p_company_id,auth.uid(),v_id,'invitation_created',p_role,jsonb_build_object('email',v_email));

  return v_id;
end;
$$;

revoke all on function public.create_workspace_invitation(uuid,text,public.member_role) from public, anon;
grant execute on function public.create_workspace_invitation(uuid,text,public.member_role) to authenticated;

create function public.revoke_workspace_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_company uuid;
  v_role public.member_role;
begin
  select company_id, role into v_company, v_role
    from public.workspace_invitations where id = p_invitation_id for update;
  if not found then raise exception 'Invitation not found'; end if;

  if auth.uid() is null or not exists (
    select 1 from public.organization_members m
    where m.company_id = v_company and m.user_id = auth.uid()
      and m.role = 'owner' and m.status = 'active'
  ) then raise exception 'Owner access required'; end if;

  update public.workspace_invitations
    set status='revoked', revoked_at=now(), updated_at=now()
    where id=p_invitation_id and status='pending';

  if found then
    insert into public.workspace_access_audit(company_id,actor_user_id,invitation_id,event_type,old_role)
      values(v_company,auth.uid(),p_invitation_id,'invitation_revoked',v_role);
  end if;
end;
$$;

revoke all on function public.revoke_workspace_invitation(uuid) from public, anon;
grant execute on function public.revoke_workspace_invitation(uuid) to authenticated;

create function public.accept_workspace_invitation(p_invitation_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_invite public.workspace_invitations%rowtype;
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_plan text;
  v_limit integer;
  v_active integer;
  v_membership uuid;
begin
  if auth.uid() is null or v_email = '' then raise exception 'Sign in required'; end if;
  if not exists (
    select 1 from public.legal_acceptances a
    where a.user_id = auth.uid()
      and a.terms_version = '2026-09-28'
      and a.privacy_version = '2026-09-28'
  ) then raise exception 'Current terms acceptance required'; end if;

  select * into v_invite from public.workspace_invitations
    where id = p_invitation_id for update;
  if not found or v_invite.status <> 'pending' then raise exception 'Invitation is not available'; end if;
  if v_invite.expires_at <= now() then
    update public.workspace_invitations set status='expired',updated_at=now() where id=p_invitation_id;
    raise exception 'Invitation expired';
  end if;
  if lower(v_invite.email) <> v_email then raise exception 'Invitation email does not match this account'; end if;

  select plan into v_plan from public.companies where id = v_invite.company_id for update;
  v_limit := private.plan_admin_limit(v_plan);
  select count(*) into v_active from public.organization_members
    where company_id = v_invite.company_id and status='active';

  select id into v_membership from public.organization_members
    where company_id=v_invite.company_id and user_id=auth.uid() for update;

  if v_membership is null then
    if v_active >= v_limit then raise exception 'Admin limit reached'; end if;
    insert into public.organization_members(company_id,user_id,role,status)
      values(v_invite.company_id,auth.uid(),v_invite.role,'active')
      returning id into v_membership;
  elsif exists (
    select 1 from public.organization_members
    where id=v_membership and status='inactive'
  ) then
    if v_active >= v_limit then raise exception 'Admin limit reached'; end if;
    update public.organization_members
      set role=v_invite.role,status='active',updated_at=now()
      where id=v_membership;
  end if;

  update public.workspace_invitations
    set status='accepted',accepted_by=auth.uid(),accepted_at=now(),updated_at=now()
    where id=p_invitation_id;

  insert into public.workspace_access_audit(company_id,actor_user_id,subject_user_id,invitation_id,event_type,new_role)
    values(v_invite.company_id,auth.uid(),auth.uid(),p_invitation_id,'invitation_accepted',v_invite.role);

  return v_invite.company_id;
end;
$$;

revoke all on function public.accept_workspace_invitation(uuid) from public, anon;
grant execute on function public.accept_workspace_invitation(uuid) to authenticated;

create function public.update_workspace_member_role(
  p_company_id uuid,
  p_user_id uuid,
  p_role public.member_role
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_old_role public.member_role;
begin
  if auth.uid() is null or not exists (
    select 1 from public.organization_members m
    where m.company_id=p_company_id and m.user_id=auth.uid()
      and m.role='owner' and m.status='active'
  ) then raise exception 'Owner access required'; end if;
  if p_role not in ('admin','manager') then raise exception 'Invalid member role'; end if;

  select role into v_old_role from public.organization_members
    where company_id=p_company_id and user_id=p_user_id for update;
  if not found then raise exception 'Member not found'; end if;
  if v_old_role='owner' then raise exception 'Owner role cannot be changed here'; end if;
  if v_old_role=p_role then return; end if;

  update public.organization_members set role=p_role,updated_at=now()
    where company_id=p_company_id and user_id=p_user_id;

  insert into public.workspace_access_audit(company_id,actor_user_id,subject_user_id,event_type,old_role,new_role)
    values(p_company_id,auth.uid(),p_user_id,'member_role_changed',v_old_role,p_role);
end;
$$;

revoke all on function public.update_workspace_member_role(uuid,uuid,public.member_role) from public, anon;
grant execute on function public.update_workspace_member_role(uuid,uuid,public.member_role) to authenticated;

create function public.set_workspace_member_active(
  p_company_id uuid,
  p_user_id uuid,
  p_active boolean
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_target public.organization_members%rowtype;
  v_plan text;
  v_limit integer;
  v_active integer;
begin
  if auth.uid() is null or not exists (
    select 1 from public.organization_members m
    where m.company_id=p_company_id and m.user_id=auth.uid()
      and m.role='owner' and m.status='active'
  ) then raise exception 'Owner access required'; end if;

  select * into v_target from public.organization_members
    where company_id=p_company_id and user_id=p_user_id for update;
  if not found then raise exception 'Member not found'; end if;
  if v_target.role='owner' or p_user_id=auth.uid() then raise exception 'Owner access cannot be removed here'; end if;

  if p_active then
    if v_target.status='active' then return; end if;
    select plan into v_plan from public.companies where id=p_company_id for update;
    v_limit := private.plan_admin_limit(v_plan);
    select count(*) into v_active from public.organization_members
      where company_id=p_company_id and status='active';
    if v_active >= v_limit then raise exception 'Admin limit reached'; end if;
    update public.organization_members set status='active',updated_at=now() where id=v_target.id;
    insert into public.workspace_access_audit(company_id,actor_user_id,subject_user_id,event_type,new_role)
      values(p_company_id,auth.uid(),p_user_id,'member_reactivated',v_target.role);
  else
    if v_target.status='inactive' then return; end if;
    update public.organization_members set status='inactive',updated_at=now() where id=v_target.id;
    insert into public.workspace_access_audit(company_id,actor_user_id,subject_user_id,event_type,old_role)
      values(p_company_id,auth.uid(),p_user_id,'member_deactivated',v_target.role);
  end if;
end;
$$;

revoke all on function public.set_workspace_member_active(uuid,uuid,boolean) from public, anon;
grant execute on function public.set_workspace_member_active(uuid,uuid,boolean) to authenticated;
