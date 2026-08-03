set search_path = public;

alter table public.profiles add column if not exists plan text;
alter table public.profiles add column if not exists plan_until timestamptz;

update public.profiles p
   set plan = 'pro'
 where (p.plan is null or btrim(p.plan) = '')
   and coalesce(p.workspace,'both') <> 'crm'
   and coalesce(p.active,true) = true;

update public.profiles p
   set plan = 'vip'
 where p.role in ('admin','owner','master');

update public.profiles
   set plan_until = null
 where plan_until is not null and plan_until < now();

insert into public.app_config(key,value) values('default_tier','pro')
on conflict (key) do update set value = excluded.value, updated_at = now();

select
  (select count(*) from public.profiles where plan is not null and btrim(plan) <> '') as tier_set,
  (select count(*) from public.profiles where plan is null or btrim(plan) = '') as tier_missing,
  (select value from public.app_config where key = 'default_tier') as default_tier;

notify pgrst, 'reload schema';
