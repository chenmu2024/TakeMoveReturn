begin;

insert into auth.users(id,email) values
  ('11111111-1111-4111-8111-111111111111','owner@example.com'),
  ('22222222-2222-4222-8222-222222222222','manager@example.com'),
  ('33333333-3333-4333-8333-333333333333','third@example.com');

insert into public.companies(id,name,slug,plan) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Membership Test','membership-test','starter');

insert into public.organization_members(company_id,user_id,role,status) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','owner','active');

insert into public.legal_acceptances(user_id,terms_version,privacy_version,terms_accepted_at,privacy_acknowledged_at) values
  ('11111111-1111-4111-8111-111111111111','2026-09-28','2026-09-28',now(),now()),
  ('22222222-2222-4222-8222-222222222222','2026-09-28','2026-09-28',now(),now()),
  ('33333333-3333-4333-8333-333333333333','2026-09-28','2026-09-28',now(),now());

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","email":"owner@example.com","role":"authenticated"}';

do $$ declare v_invite uuid; begin
  v_invite := public.create_workspace_invitation(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'manager@example.com',
    'manager'
  );
  perform set_config('test.member_invite',v_invite::text,true);

  if (select count(*) from public.workspace_invitations where id=v_invite and status='pending') <> 1 then
    raise exception 'Invitation was not created';
  end if;

  begin
    perform public.create_workspace_invitation(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'third@example.com',
      'admin'
    );
    raise exception 'Plan admin limit did not reserve the pending invitation';
  exception when others then
    if SQLERRM <> 'Admin limit reached' then raise; end if;
  end;
end $$;

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","email":"manager@example.com","role":"authenticated"}';

do $$ declare v_invite uuid := current_setting('test.member_invite')::uuid; v_company uuid; begin
  if (select count(*) from public.list_my_workspace_invitations()) <> 1 then
    raise exception 'Invitee cannot list own pending invitation';
  end if;

  v_company := public.accept_workspace_invitation(v_invite);
  if v_company <> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid then
    raise exception 'Accepted invitation returned wrong company';
  end if;

  if not exists (
    select 1 from public.organization_members
    where company_id=v_company
      and user_id='22222222-2222-4222-8222-222222222222'
      and role='manager'
      and status='active'
  ) then raise exception 'Invitation did not create active membership'; end if;

  begin
    perform public.create_workspace_invitation(
      v_company,
      'third@example.com',
      'admin'
    );
    raise exception 'Non-owner created an invitation';
  exception when others then
    if SQLERRM <> 'Owner access required' then raise; end if;
  end;
end $$;

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","email":"owner@example.com","role":"authenticated"}';

do $$ declare v_third uuid; begin
  perform public.update_workspace_member_role(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'admin'
  );
  if (select role from public.organization_members
      where company_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
        and user_id='22222222-2222-4222-8222-222222222222') <> 'admin' then
    raise exception 'Owner could not change member role';
  end if;

  perform public.set_workspace_member_active(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    false
  );

  v_third := public.create_workspace_invitation(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'third@example.com',
    'manager'
  );

  begin
    perform public.set_workspace_member_active(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '22222222-2222-4222-8222-222222222222',
      true
    );
    raise exception 'Reactivation ignored a reserved invitation seat';
  exception when others then
    if SQLERRM <> 'Admin limit reached' then raise; end if;
  end;

  perform public.revoke_workspace_invitation(v_third);
  perform public.set_workspace_member_active(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    true
  );

  begin
    perform public.set_workspace_member_active(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      false
    );
    raise exception 'Owner was allowed to deactivate self';
  exception when others then
    if SQLERRM <> 'Owner access cannot be removed here' then raise; end if;
  end;

  if (select count(*) from public.workspace_access_audit
      where company_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') < 6 then
    raise exception 'Membership audit trail is incomplete';
  end if;
end $$;

rollback;
