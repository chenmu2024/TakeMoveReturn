begin;

insert into auth.users(id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.companies(id,name,slug,plan) values
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','Billing A','billing-life-a','starter');
insert into public.organization_members(company_id,user_id,role) values
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','owner');
insert into public.legal_acceptances(user_id,terms_version,privacy_version,terms_accepted_at,privacy_acknowledged_at)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-09-28','2026-09-28',now(),now());

insert into public.billing_checkout_intents(
  id,company_id,user_id,plan,billing_interval,product_id,status,session_id,expires_at
) values (
  'aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa',
  'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'starter','month','PROD_6r7BgQwdISjVP4rSXOSKM2','fulfilled','SES_seed',now() + interval '1 day'
);

insert into public.billing_subscriptions(
  company_id,order_id,checkout_intent_id,plan,billing_interval,status,current_period_end,last_event_at
) values (
  'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
  'ORD_0000000000000000000001',
  'aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa',
  'starter','month','active','2026-10-29T00:00:00Z','2026-09-29T00:00:00Z'
);

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

do $$ declare v_change uuid; begin
  begin
    perform public.create_billing_plan_change_intent(
      'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','growth','month',
      'PROD_4nt9dFLFaZPJleMoIB7Noi','next_period'
    );
    raise exception 'Upgrade accepted incorrect next-period timing';
  exception when others then
    if SQLERRM <> 'Invalid plan change timing' then raise; end if;
  end;

  v_change := public.create_billing_plan_change_intent(
    'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','growth','month',
    'PROD_4nt9dFLFaZPJleMoIB7Noi','immediate'
  );
  perform public.mark_billing_plan_change_started(v_change,'SES_change_1');
  perform set_config('test.billing_change_id',v_change::text,true);

  if (select count(*) from public.billing_plan_change_intents where id = v_change) <> 1 then
    raise exception 'Owner cannot read own plan-change intent';
  end if;

  begin
    perform public.create_billing_plan_change_intent(
      'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','pro','month',
      'PROD_47MCf9ZEwTRsubJ4BKepj1','immediate'
    );
    raise exception 'Parallel plan change was allowed';
  exception when others then
    if SQLERRM <> 'Plan change already in progress' then raise; end if;
  end;

  begin
    perform public.apply_waffo_plan_change_event(
      'subscription.plan_changed','evt_user_forbidden','ORD_0000000000000000000001',
      '2026-09-29T02:00:00Z','2026-10-29T00:00:00Z'
    );
    raise exception 'Authenticated user invoked service-role billing RPC';
  exception when insufficient_privilege then null;
  end;
end $$;

set local role service_role;

do $$ declare v_change uuid := current_setting('test.billing_change_id')::uuid; begin
  if public.apply_waffo_plan_change_event(
    'subscription.plan_changed','evt_change_1','ORD_0000000000000000000001',
    '2026-09-29T02:00:00Z','2026-10-29T00:00:00Z'
  ) <> 'applied' then
    raise exception 'Plan change was not applied';
  end if;

  if (select plan from public.billing_subscriptions where company_id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') <> 'growth'
    or (select billing_interval from public.billing_subscriptions where company_id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') <> 'month'
    or (select plan from public.companies where id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') <> 'growth'
    or (select status from public.billing_plan_change_intents where id=v_change) <> 'applied' then
    raise exception 'Plan change did not reconcile subscription and entitlement';
  end if;

  if public.apply_waffo_plan_change_event(
    'subscription.plan_changed','evt_change_1','ORD_0000000000000000000001',
    '2026-09-29T02:00:00Z','2026-10-29T00:00:00Z'
  ) <> 'duplicate' then
    raise exception 'Duplicate plan-change event was not deduplicated';
  end if;

  perform public.apply_waffo_subscription_lifecycle_event(
    'subscription.canceling','evt_canceling_1','ORD_0000000000000000000001',
    '2026-09-29T03:00:00Z','2026-10-29T00:00:00Z'
  );
  if (select status from public.billing_subscriptions where company_id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') <> 'canceling'
    or (select plan from public.companies where id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') <> 'growth' then
    raise exception 'Canceling changed entitlement incorrectly';
  end if;

  perform public.apply_waffo_subscription_lifecycle_event(
    'subscription.uncanceled','evt_uncancel_1','ORD_0000000000000000000001',
    '2026-09-29T04:00:00Z','2026-10-29T00:00:00Z'
  );
  if (select status from public.billing_subscriptions where company_id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') <> 'active' then
    raise exception 'Uncancel did not restore active status';
  end if;

  perform public.apply_waffo_subscription_lifecycle_event(
    'subscription.past_due','evt_past_due_1','ORD_0000000000000000000001',
    '2026-09-29T05:00:00Z','2026-10-29T00:00:00Z'
  );
  if (select status from public.billing_subscriptions where company_id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') <> 'past_due'
    or (select plan from public.companies where id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') <> 'growth' then
    raise exception 'Past due removed paid entitlement prematurely';
  end if;

  perform public.apply_waffo_subscription_lifecycle_event(
    'subscription.recovered','evt_recovered_1','ORD_0000000000000000000001',
    '2026-09-29T06:00:00Z','2026-10-29T00:00:00Z'
  );
  if (select status from public.billing_subscriptions where company_id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') <> 'active' then
    raise exception 'Recovered subscription did not return to active';
  end if;

  perform public.apply_waffo_subscription_lifecycle_event(
    'subscription.canceled','evt_canceled_1','ORD_0000000000000000000001',
    '2026-10-29T00:00:01Z','2026-10-29T00:00:00Z'
  );
  if (select status from public.billing_subscriptions where company_id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') <> 'canceled'
    or (select plan from public.companies where id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') <> 'free' then
    raise exception 'Canceled subscription did not fall back to Free';
  end if;

  if public.apply_waffo_subscription_lifecycle_event(
    'subscription.renewed','evt_stale_1','ORD_0000000000000000000001',
    '2026-10-01T00:00:00Z','2026-11-29T00:00:00Z'
  ) <> 'stale' then
    raise exception 'Stale lifecycle event was not ignored';
  end if;

  if (select plan from public.companies where id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') <> 'free' then
    raise exception 'Stale lifecycle event changed entitlement';
  end if;
end $$;

rollback;
