set search_path = public;

create table if not exists public.worry_orders(
  id uuid primary key default gen_random_uuid(),
  order_id text,
  payment_key text,
  amount int,
  buyer_name text default '',
  agent_name text default '',
  status text not null default 'paid',
  created_at timestamptz default now()
);

alter table public.worry_orders add column if not exists buyer_name text default '';
alter table public.worry_orders add column if not exists agent_name text default '';
alter table public.worry_orders add column if not exists status text not null default 'paid';

create index if not exists worry_orders_created_idx on public.worry_orders(created_at desc);
create unique index if not exists worry_orders_order_uniq on public.worry_orders(order_id);

alter table public.worry_orders enable row level security;

drop policy if exists worry_orders_read on public.worry_orders;
create policy worry_orders_read on public.worry_orders
  for select to authenticated
  using (public.is_admin() or public.is_owner());

revoke all on public.worry_orders from authenticated;
grant select on public.worry_orders to authenticated;

insert into public.app_config(key, value)
values ('schema_version', '34')
on conflict (key) do update set value = excluded.value, updated_at = now();

notify pgrst, 'reload schema';

select
  to_regclass('public.worry_orders') is not null              as 고민상담_결제표,
  (select count(*) from public.worry_orders)                  as 결제건수,
  (select coalesce(sum(amount), 0) from public.worry_orders)  as 합계금액,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'worry_orders') as 정책수;
