create table public.billing_checkout_intents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  plan text not null check (plan in ('starter', 'growth', 'pro')),
  billing_interval text not null check (billing_interval in ('month', 'year')),
  product_id text not null,
  status text not null default 'pending' check (status in ('pending', 'started', 'fulfilled')),
  session_id text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '45 minutes')
);

create table public.billing_subscriptions (
  company_id uuid primary key references public.companies(id) on delete cascade,
  order_id text not null unique,
  checkout_intent_id uuid not null references public.billing_checkout_intents(id),
  plan text not null check (plan in ('starter', 'growth', 'pro')),
  billing_interval text not null check (billing_interval in ('month', 'year')),
  status text not null check (status in ('active', 'canceling', 'past_due', 'canceled')),
  current_period_end timestamptz,
  last_event_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table public.billing_webhook_events (
  event_type text not null,
  event_id text not null,
  order_id text not null,
  received_at timestamptz not null default now(),
  primary key (event_type, event_id)
);

create index billing_intents_company_created_idx on public.billing_checkout_intents(company_id, created_at desc);
alter table public.billing_checkout_intents enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_webhook_events enable row level security;

create policy "owners read billing intents" on public.billing_checkout_intents for select to authenticated
using (exists (select 1 from public.organization_members m where m.company_id = billing_checkout_intents.company_id
  and m.user_id = auth.uid() and m.role = 'owner' and m.status = 'active'));
create policy "owners read subscriptions" on public.billing_subscriptions for select to authenticated
using (exists (select 1 from public.organization_members m where m.company_id = billing_subscriptions.company_id
  and m.user_id = auth.uid() and m.role = 'owner' and m.status = 'active'));

revoke all on public.billing_checkout_intents, public.billing_subscriptions, public.billing_webhook_events from public, anon, authenticated;
grant select on public.billing_checkout_intents, public.billing_subscriptions to authenticated;

create function public.create_billing_checkout_intent(p_company_id uuid, p_plan text, p_interval text, p_product_id text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_expected_product text;
begin
  if auth.uid() is null or not exists (select 1 from public.organization_members m
    where m.company_id = p_company_id and m.user_id = auth.uid() and m.role = 'owner' and m.status = 'active') then
    raise exception 'Owner access required';
  end if;
  if not exists (select 1 from public.legal_acceptances a where a.user_id = auth.uid()
    and a.terms_version = '2026-09-28' and a.privacy_version = '2026-09-28') then
    raise exception 'Current terms acceptance required';
  end if;
  v_expected_product := case
    when p_plan = 'starter' and p_interval = 'month' then 'PROD_6r7BgQwdISjVP4rSXOSKM2'
    when p_plan = 'starter' and p_interval = 'year' then 'PROD_6q1uR35uOFyVYKDg4ypBfn'
    when p_plan = 'growth' and p_interval = 'month' then 'PROD_4nt9dFLFaZPJleMoIB7Noi'
    when p_plan = 'growth' and p_interval = 'year' then 'PROD_3TsrSqcc4LaDFNgUj2xPLG'
    when p_plan = 'pro' and p_interval = 'month' then 'PROD_47MCf9ZEwTRsubJ4BKepj1'
    when p_plan = 'pro' and p_interval = 'year' then 'PROD_52Zme9Q6c2FruTBXOxtsNq'
  end;
  if p_product_id is distinct from v_expected_product then raise exception 'Invalid checkout selection'; end if;
  perform 1 from public.companies where id = p_company_id for update;
  if exists (select 1 from public.billing_subscriptions s where s.company_id = p_company_id
    and s.status in ('active', 'canceling', 'past_due')) then raise exception 'Subscription already exists'; end if;
  insert into public.billing_checkout_intents(company_id,user_id,plan,billing_interval,product_id)
    values(p_company_id,auth.uid(),p_plan,p_interval,p_product_id) returning id into v_id;
  return v_id;
end $$;
revoke all on function public.create_billing_checkout_intent(uuid,text,text,text) from public, anon;
grant execute on function public.create_billing_checkout_intent(uuid,text,text,text) to authenticated;

create function public.mark_billing_checkout_started(p_intent_id uuid, p_session_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or p_session_id is null or length(p_session_id) not between 1 and 200 then
    raise exception 'Invalid checkout session';
  end if;
  update public.billing_checkout_intents set status = 'started', session_id = p_session_id
    where id = p_intent_id and user_id = auth.uid() and status = 'pending' and expires_at > now();
  if not found then raise exception 'Checkout intent expired'; end if;
end $$;
revoke all on function public.mark_billing_checkout_started(uuid,text) from public, anon;
grant execute on function public.mark_billing_checkout_started(uuid,text) to authenticated;

create function public.apply_waffo_subscription_event(
  p_event_type text, p_event_id text, p_order_id text, p_intent_id uuid,
  p_occurred_at timestamptz, p_period_end timestamptz
) returns text language plpgsql security definer set search_path = '' as $$
declare
  v_intent public.billing_checkout_intents%rowtype;
  v_existing public.billing_subscriptions%rowtype;
  v_status text;
begin
  if auth.role() <> 'service_role' then raise exception 'Forbidden'; end if;
  if p_event_type not in ('subscription.activated','subscription.renewed','subscription.recovered',
    'subscription.canceling','subscription.uncanceled','subscription.past_due','subscription.canceled')
    or p_event_id is null or length(p_event_id) not between 1 and 200
    or p_order_id is null or length(p_order_id) not between 1 and 200
    or p_occurred_at is null then raise exception 'Invalid billing event'; end if;
  select * into v_intent from public.billing_checkout_intents where id = p_intent_id;
  if not found then raise exception 'Unknown checkout intent'; end if;
  perform 1 from public.companies where id = v_intent.company_id for update;
  if exists (select 1 from public.billing_webhook_events
    where event_type = p_event_type and event_id = p_event_id) then return 'duplicate'; end if;
  select * into v_existing from public.billing_subscriptions where company_id = v_intent.company_id for update;
  if found and v_existing.status <> 'canceled'
    and (v_existing.order_id <> p_order_id or v_existing.checkout_intent_id <> p_intent_id) then
    raise exception 'Subscription order mismatch';
  end if;
  if found and v_existing.status = 'canceled'
    and (p_event_type <> 'subscription.activated' or v_existing.order_id = p_order_id) then
    raise exception 'A new checkout is required';
  end if;
  if not found and p_event_type <> 'subscription.activated' then
    raise exception 'Activation not yet received';
  end if;
  if found and v_existing.order_id = p_order_id and p_occurred_at < v_existing.last_event_at then
    insert into public.billing_webhook_events(event_type,event_id,order_id) values(p_event_type,p_event_id,p_order_id);
    return 'stale';
  end if;
  v_status := case p_event_type
    when 'subscription.canceling' then 'canceling'
    when 'subscription.past_due' then 'past_due'
    when 'subscription.canceled' then 'canceled'
    else 'active' end;
  insert into public.billing_subscriptions(company_id,order_id,checkout_intent_id,plan,billing_interval,status,current_period_end,last_event_at)
    values(v_intent.company_id,p_order_id,p_intent_id,v_intent.plan,v_intent.billing_interval,v_status,p_period_end,p_occurred_at)
    on conflict (company_id) do update set order_id = excluded.order_id,
      checkout_intent_id = excluded.checkout_intent_id, plan = excluded.plan,
      billing_interval = excluded.billing_interval, status = excluded.status,
      current_period_end = coalesce(excluded.current_period_end, billing_subscriptions.current_period_end),
      last_event_at = excluded.last_event_at, updated_at = now();
  update public.companies set plan = case when v_status = 'canceled' then 'free' else v_intent.plan end,
    updated_at = now() where id = v_intent.company_id;
  update public.billing_checkout_intents set status = 'fulfilled' where id = p_intent_id;
  insert into public.billing_webhook_events(event_type,event_id,order_id) values(p_event_type,p_event_id,p_order_id);
  return 'applied';
end $$;
revoke all on function public.apply_waffo_subscription_event(text,text,text,uuid,timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.apply_waffo_subscription_event(text,text,text,uuid,timestamptz,timestamptz) to service_role;
