create table public.billing_plan_change_intents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  order_id text not null,
  from_plan text not null check (from_plan in ('starter', 'growth', 'pro')),
  to_plan text not null check (to_plan in ('starter', 'growth', 'pro')),
  from_billing_interval text not null check (from_billing_interval in ('month', 'year')),
  to_billing_interval text not null check (to_billing_interval in ('month', 'year')),
  product_id text not null,
  timing text not null check (timing in ('immediate', 'next_period')),
  status text not null default 'pending'
    check (status in ('pending', 'session_created', 'scheduled', 'applied', 'failed')),
  session_id text,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '45 minutes')
);

create unique index billing_plan_change_one_open_per_company_idx
  on public.billing_plan_change_intents(company_id)
  where status in ('pending', 'session_created', 'scheduled');

create index billing_plan_change_order_created_idx
  on public.billing_plan_change_intents(order_id, created_at desc);

alter table public.billing_plan_change_intents enable row level security;

create policy "owners read billing plan changes" on public.billing_plan_change_intents
for select to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.company_id = billing_plan_change_intents.company_id
    and m.user_id = auth.uid()
    and m.role = 'owner'
    and m.status = 'active'
));

revoke all on public.billing_plan_change_intents from public, anon, authenticated;
grant select on public.billing_plan_change_intents to authenticated;

create function public.create_billing_plan_change_intent(
  p_company_id uuid,
  p_to_plan text,
  p_to_interval text,
  p_product_id text,
  p_timing text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_subscription public.billing_subscriptions%rowtype;
  v_expected_product text;
  v_expected_timing text;
  v_from_rank integer;
  v_to_rank integer;
begin
  if auth.uid() is null or not exists (
    select 1 from public.organization_members m
    where m.company_id = p_company_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
      and m.status = 'active'
  ) then
    raise exception 'Owner access required';
  end if;

  if not exists (
    select 1 from public.legal_acceptances a
    where a.user_id = auth.uid()
      and a.terms_version = '2026-09-28'
      and a.privacy_version = '2026-09-28'
  ) then
    raise exception 'Current terms acceptance required';
  end if;

  v_expected_product := case
    when p_to_plan = 'starter' and p_to_interval = 'month' then 'PROD_6r7BgQwdISjVP4rSXOSKM2'
    when p_to_plan = 'starter' and p_to_interval = 'year' then 'PROD_6q1uR35uOFyVYKDg4ypBfn'
    when p_to_plan = 'growth' and p_to_interval = 'month' then 'PROD_4nt9dFLFaZPJleMoIB7Noi'
    when p_to_plan = 'growth' and p_to_interval = 'year' then 'PROD_3TsrSqcc4LaDFNgUj2xPLG'
    when p_to_plan = 'pro' and p_to_interval = 'month' then 'PROD_47MCf9ZEwTRsubJ4BKepj1'
    when p_to_plan = 'pro' and p_to_interval = 'year' then 'PROD_52Zme9Q6c2FruTBXOxtsNq'
  end;
  if p_product_id is distinct from v_expected_product then
    raise exception 'Invalid plan change selection';
  end if;

  perform 1 from public.companies where id = p_company_id for update;
  select * into v_subscription from public.billing_subscriptions
    where company_id = p_company_id for update;

  if not found or v_subscription.status <> 'active' then
    raise exception 'Active subscription required';
  end if;
  if v_subscription.plan = p_to_plan and v_subscription.billing_interval = p_to_interval then
    raise exception 'Subscription already uses that plan and interval';
  end if;

  v_from_rank := case v_subscription.plan when 'starter' then 1 when 'growth' then 2 when 'pro' then 3 end;
  v_to_rank := case p_to_plan when 'starter' then 1 when 'growth' then 2 when 'pro' then 3 end;
  v_expected_timing := case
    when v_to_rank > v_from_rank then 'immediate'
    else 'next_period'
  end;
  if p_timing is distinct from v_expected_timing then
    raise exception 'Invalid plan change timing';
  end if;

  if exists (
    select 1 from public.billing_plan_change_intents i
    where i.company_id = p_company_id
      and i.status in ('pending', 'session_created', 'scheduled')
      and (i.status = 'scheduled' or i.expires_at > now())
  ) then
    raise exception 'Plan change already in progress';
  end if;

  update public.billing_plan_change_intents
    set status = 'failed', updated_at = now()
    where company_id = p_company_id
      and status in ('pending', 'session_created')
      and expires_at <= now();

  insert into public.billing_plan_change_intents(
    company_id, user_id, order_id, from_plan, to_plan,
    from_billing_interval, to_billing_interval, product_id, timing
  ) values (
    p_company_id, auth.uid(), v_subscription.order_id, v_subscription.plan, p_to_plan,
    v_subscription.billing_interval, p_to_interval, p_product_id, p_timing
  ) returning id into v_id;

  return v_id;
end $$;

revoke all on function public.create_billing_plan_change_intent(uuid,text,text,text,text) from public, anon;
grant execute on function public.create_billing_plan_change_intent(uuid,text,text,text,text) to authenticated;

create function public.mark_billing_plan_change_started(p_intent_id uuid, p_session_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or p_session_id is null or length(p_session_id) not between 1 and 200 then
    raise exception 'Invalid plan change session';
  end if;

  update public.billing_plan_change_intents
    set status = 'session_created', session_id = p_session_id, updated_at = now()
    where id = p_intent_id
      and user_id = auth.uid()
      and status = 'pending'
      and expires_at > now();

  if not found then raise exception 'Plan change intent expired'; end if;
end $$;

revoke all on function public.mark_billing_plan_change_started(uuid,text) from public, anon;
grant execute on function public.mark_billing_plan_change_started(uuid,text) to authenticated;

create function public.apply_waffo_plan_change_event(
  p_event_type text,
  p_event_id text,
  p_order_id text,
  p_occurred_at timestamptz,
  p_period_end timestamptz
) returns text language plpgsql security definer set search_path = '' as $$
declare
  v_subscription public.billing_subscriptions%rowtype;
  v_change public.billing_plan_change_intents%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'Forbidden'; end if;
  if p_event_type not in (
      'subscription.plan_changed',
      'subscription.plan_change_scheduled',
      'subscription.plan_change_failed'
    )
    or p_event_id is null or length(p_event_id) not between 1 and 200
    or p_order_id is null or length(p_order_id) not between 1 and 200
    or p_occurred_at is null then
    raise exception 'Invalid plan change event';
  end if;

  if exists (
    select 1 from public.billing_webhook_events
    where event_type = p_event_type and event_id = p_event_id
  ) then return 'duplicate'; end if;

  select * into v_subscription from public.billing_subscriptions
    where order_id = p_order_id for update;
  if not found then raise exception 'Unknown subscription order'; end if;

  select * into v_change from public.billing_plan_change_intents
    where company_id = v_subscription.company_id
      and order_id = p_order_id
      and status in ('session_created', 'scheduled')
    order by created_at desc
    limit 1
    for update;
  if not found then raise exception 'No matching plan change intent'; end if;

  if p_occurred_at < v_subscription.last_event_at then
    insert into public.billing_webhook_events(event_type,event_id,order_id)
      values(p_event_type,p_event_id,p_order_id);
    return 'stale';
  end if;

  if p_event_type = 'subscription.plan_change_scheduled' then
    update public.billing_plan_change_intents
      set status = 'scheduled', last_event_at = p_occurred_at, updated_at = now()
      where id = v_change.id;
    update public.billing_subscriptions
      set current_period_end = coalesce(p_period_end, current_period_end),
          last_event_at = p_occurred_at,
          updated_at = now()
      where company_id = v_subscription.company_id;
  elsif p_event_type = 'subscription.plan_change_failed' then
    update public.billing_plan_change_intents
      set status = 'failed', last_event_at = p_occurred_at, updated_at = now()
      where id = v_change.id;
    update public.billing_subscriptions
      set current_period_end = coalesce(p_period_end, current_period_end),
          last_event_at = p_occurred_at,
          updated_at = now()
      where company_id = v_subscription.company_id;
  else
    update public.billing_plan_change_intents
      set status = 'applied', last_event_at = p_occurred_at, updated_at = now()
      where id = v_change.id;
    update public.billing_subscriptions
      set plan = v_change.to_plan,
          billing_interval = v_change.to_billing_interval,
          status = 'active',
          current_period_end = coalesce(p_period_end, current_period_end),
          last_event_at = p_occurred_at,
          updated_at = now()
      where company_id = v_subscription.company_id;
    update public.companies
      set plan = v_change.to_plan, updated_at = now()
      where id = v_subscription.company_id;
  end if;

  insert into public.billing_webhook_events(event_type,event_id,order_id)
    values(p_event_type,p_event_id,p_order_id);
  return 'applied';
end $$;

revoke all on function public.apply_waffo_plan_change_event(text,text,text,timestamptz,timestamptz)
  from public, anon, authenticated;
grant execute on function public.apply_waffo_plan_change_event(text,text,text,timestamptz,timestamptz)
  to service_role;
