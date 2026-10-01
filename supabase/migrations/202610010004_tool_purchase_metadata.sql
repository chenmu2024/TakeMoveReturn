-- Add source-of-truth purchase metadata to tool records.

alter table public.tools
  add column purchase_date date,
  add column purchase_price numeric(12,2),
  add constraint tools_purchase_price_nonnegative
    check (purchase_price is null or purchase_price >= 0);

grant update (purchase_date, purchase_price) on public.tools to authenticated;
