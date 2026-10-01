-- Optional overdue-return email reminder queue.
-- Disabled at the Worker layer until OVERDUE_REMINDERS_ENABLED=true and Resend credentials are configured.

create table public.overdue_reminder_dispatches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_date date not null,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  unique(company_id,user_id,reminder_date)
);

alter table public.overdue_reminder_dispatches enable row level security;
revoke all on public.overdue_reminder_dispatches from public,anon,authenticated;

create or replace function public.overdue_reminder_candidates(p_limit integer default 100)
returns table(
  dispatch_id uuid,
  company_id uuid,
  company_name text,
  recipient_email text,
  reminder_date date,
  overdue_count bigint,
  oldest_due_date date
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer := greatest(1,least(coalesce(p_limit,100),500));
begin
  return query
  with overdue as (
    select
      c.id as company_id,
      c.name as company_name,
      (pg_catalog.now() at time zone c.timezone)::date as local_date,
      count(t.id)::bigint as overdue_count,
      min(t.expected_return_date) as oldest_due_date
    from public.companies c
    join public.tools t on t.company_id = c.id
      and t.status = 'checked_out'
      and t.expected_return_date is not null
      and t.expected_return_date < (pg_catalog.now() at time zone c.timezone)::date
    group by c.id,c.name,c.timezone
  ),
  recipients as (
    select o.*,m.user_id,u.email
    from overdue o
    join public.organization_members m on m.company_id=o.company_id
      and m.status='active' and m.role in ('owner','admin','manager')
    join auth.users u on u.id=m.user_id
    where u.email is not null and char_length(u.email) between 3 and 320
  ),
  eligible as (
    select r.*
    from recipients r
    left join public.overdue_reminder_dispatches d
      on d.company_id=r.company_id and d.user_id=r.user_id and d.reminder_date=r.local_date
    where d.id is null
      or (d.status='failed' and coalesce(d.last_attempt_at,d.created_at) < pg_catalog.now()-interval '1 hour')
    order by r.oldest_due_date,r.company_id,r.user_id
    limit v_limit
  ),
  upserted as (
    insert into public.overdue_reminder_dispatches(company_id,user_id,reminder_date,status,attempt_count,last_attempt_at,last_error)
    select e.company_id,e.user_id,e.local_date,'pending',1,pg_catalog.now(),null
    from eligible e
    on conflict(company_id,user_id,reminder_date) do update
      set status='pending',
          attempt_count=public.overdue_reminder_dispatches.attempt_count+1,
          last_attempt_at=pg_catalog.now(),
          last_error=null,
          updated_at=pg_catalog.now()
      where public.overdue_reminder_dispatches.status='failed'
        and coalesce(public.overdue_reminder_dispatches.last_attempt_at,public.overdue_reminder_dispatches.created_at) < pg_catalog.now()-interval '1 hour'
    returning id,company_id,user_id,reminder_date
  )
  select u.id,e.company_id,e.company_name,e.email,e.local_date,e.overdue_count,e.oldest_due_date
  from upserted u
  join eligible e on e.company_id=u.company_id and e.user_id=u.user_id and e.local_date=u.reminder_date;
end;
$$;

revoke all on function public.overdue_reminder_candidates(integer) from public,anon,authenticated;
grant execute on function public.overdue_reminder_candidates(integer) to service_role;

create or replace function public.complete_overdue_reminder(
  p_dispatch_id uuid,
  p_succeeded boolean,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.overdue_reminder_dispatches
  set status=case when p_succeeded then 'sent' else 'failed' end,
      sent_at=case when p_succeeded then pg_catalog.now() else sent_at end,
      last_error=case when p_succeeded then null else left(coalesce(p_error,'Email delivery failed'),1000) end,
      updated_at=pg_catalog.now()
  where id=p_dispatch_id and status='pending';
end;
$$;

revoke all on function public.complete_overdue_reminder(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.complete_overdue_reminder(uuid,boolean,text) to service_role;
