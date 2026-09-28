create or replace function public.create_billing_checkout_intent(p_company_id uuid, p_plan text, p_interval text, p_product_id text)
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
  if exists (select 1 from public.billing_checkout_intents i where i.company_id = p_company_id
    and i.status in ('pending', 'started') and i.expires_at > now()) then
    raise exception 'Checkout already in progress';
  end if;
  insert into public.billing_checkout_intents(company_id,user_id,plan,billing_interval,product_id)
    values(p_company_id,auth.uid(),p_plan,p_interval,p_product_id) returning id into v_id;
  return v_id;
end $$;
