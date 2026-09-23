create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'admin', 'manager');
create type public.tool_status as enum ('available', 'checked_out', 'damaged', 'maintenance', 'missing', 'retired');
create type public.location_type as enum ('warehouse', 'job_site', 'truck', 'other');
create type public.transaction_type as enum ('checkout', 'return', 'transfer', 'damage', 'maintenance', 'repair', 'missing', 'found', 'correction', 'retire');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'free' check (plan in ('free', 'starter', 'growth', 'pro')),
  timezone text not null default 'UTC',
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type public.location_type not null,
  name text not null,
  address text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  phone text,
  employee_code text,
  pin_hash text not null,
  pin_salt text not null,
  pin_hash_version integer not null default 1,
  pin_iterations integer not null default 600000,
  auth_version integer not null default 1,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tools (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  asset_code text not null,
  qr_token text not null unique,
  name text not null,
  category text,
  brand text,
  model text,
  serial_number text,
  status public.tool_status not null default 'available',
  condition text not null default 'good' check (condition in ('new', 'good', 'fair', 'poor', 'unusable')),
  current_worker_id uuid references public.workers(id),
  current_location_id uuid references public.locations(id),
  description text,
  notes text,
  expected_return_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, asset_code)
);

create table public.tool_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete restrict,
  transaction_type public.transaction_type not null,
  from_worker_id uuid references public.workers(id),
  to_worker_id uuid references public.workers(id),
  from_location_id uuid references public.locations(id),
  to_location_id uuid references public.locations(id),
  performed_by_user_id uuid references auth.users(id),
  performed_by_worker_id uuid references public.workers(id),
  notes text,
  reverses_transaction_id uuid references public.tool_transactions(id),
  created_at timestamptz not null default now()
);

create index tools_company_status_idx on public.tools(company_id, status);
create index transactions_company_tool_created_idx on public.tool_transactions(company_id, tool_id, created_at desc);

create or replace function public.is_active_member(target_company_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where company_id = target_company_id and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.can_manage_company(target_company_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where company_id = target_company_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'admin', 'manager')
  );
$$;

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.locations enable row level security;
alter table public.workers enable row level security;
alter table public.tools enable row level security;
alter table public.tool_transactions enable row level security;

create policy "members read company" on public.companies for select using (public.is_active_member(id));
create policy "users read own profile" on public.profiles for select using (id = auth.uid());
create policy "users update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "members read memberships" on public.organization_members for select using (public.is_active_member(company_id));
create policy "members read locations" on public.locations for select using (public.is_active_member(company_id));
create policy "members read workers" on public.workers for select using (public.is_active_member(company_id));
create policy "members read tools" on public.tools for select using (public.is_active_member(company_id));
create policy "members read transactions" on public.tool_transactions for select using (public.is_active_member(company_id));
create policy "managers create locations" on public.locations for insert with check (public.can_manage_company(company_id));
create policy "managers update locations" on public.locations for update using (public.can_manage_company(company_id)) with check (public.can_manage_company(company_id));
create policy "managers delete locations" on public.locations for delete using (public.can_manage_company(company_id));
create policy "managers create workers" on public.workers for insert with check (public.can_manage_company(company_id));
create policy "managers update workers" on public.workers for update using (public.can_manage_company(company_id)) with check (public.can_manage_company(company_id));
create policy "managers delete workers" on public.workers for delete using (public.can_manage_company(company_id));
create policy "managers create tools" on public.tools for insert with check (public.can_manage_company(company_id));
create policy "managers update tools" on public.tools for update using (public.can_manage_company(company_id)) with check (public.can_manage_company(company_id));
create policy "managers delete tools" on public.tools for delete using (public.can_manage_company(company_id));
create policy "members record transactions" on public.tool_transactions for insert with check (
  public.is_active_member(company_id)
  and performed_by_user_id = auth.uid()
);
