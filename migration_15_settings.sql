set search_path = public;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','owner','master','manager','lead','leader','member'));

alter table public.profiles alter column status set default 'pending';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $fn$
begin
  insert into public.profiles(id, name, role, status)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(coalesce(new.email,''),'@',1), ''),
          'member', 'pending')
  on conflict (id) do nothing;
  return new;
end;
$fn$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles(id, name, role, status)
select u.id,
       coalesce(nullif(u.raw_user_meta_data->>'name',''), split_part(coalesce(u.email,''),'@',1), ''),
       'member', 'pending'
  from auth.users u
  left join public.profiles p on p.id = u.id
 where p.id is null
on conflict (id) do nothing;

do $mig$
begin
  if exists (select 1 from information_schema.columns
              where table_schema='public' and table_name='app_config_old_backup' and column_name='k') then
    execute $q$insert into public.app_config(key, value)
      select b.k, trim(both '"' from b.v::text)
        from public.app_config_old_backup b
      on conflict (key) do nothing$q$;
  end if;
end
$mig$;

drop policy if exists app_config_write on public.app_config;
create policy app_config_write on public.app_config for all to authenticated
  using (public.is_owner() or public.is_admin())
  with check (public.is_owner() or public.is_admin());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.is_admin() or public.is_owner())
  with check (public.is_admin() or public.is_owner());

create table if not exists public.os_notices(
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  text text,
  img text,
  active boolean default true,
  author text
);
alter table public.os_notices enable row level security;
drop policy if exists os_notices_read on public.os_notices;
create policy os_notices_read on public.os_notices for select using (true);
drop policy if exists os_notices_admin_write on public.os_notices;
create policy os_notices_admin_write on public.os_notices for all to authenticated
  using (public.is_admin() or public.is_owner())
  with check (public.is_admin() or public.is_owner());
grant select on public.os_notices to anon;
grant select, insert, update, delete on public.os_notices to authenticated;

create table if not exists public.tool_access(
  group_key text primary key,
  roles text[] not null default '{}',
  updated_at timestamptz default now()
);
alter table public.tool_access add column if not exists min_tier text;
alter table public.tool_access enable row level security;
drop policy if exists tool_access_read on public.tool_access;
create policy tool_access_read on public.tool_access for select using (true);
drop policy if exists tool_access_write on public.tool_access;
create policy tool_access_write on public.tool_access for all to authenticated
  using (public.is_admin() or public.is_owner())
  with check (public.is_admin() or public.is_owner());
grant select on public.tool_access to anon;
grant select, insert, update, delete on public.tool_access to authenticated;

create table if not exists public.payment_requests(
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid,
  name text,
  plan text,
  amount int,
  cycle text,
  method text,
  status text default 'pending'
);
alter table public.payment_requests enable row level security;
drop policy if exists pay_req_insert on public.payment_requests;
create policy pay_req_insert on public.payment_requests for insert to authenticated with check (true);
drop policy if exists pay_req_admin on public.payment_requests;
create policy pay_req_admin on public.payment_requests for select to authenticated
  using (public.is_admin() or public.is_owner() or user_id = auth.uid());
drop policy if exists pay_req_admin_upd on public.payment_requests;
create policy pay_req_admin_upd on public.payment_requests for update to authenticated
  using (public.is_admin() or public.is_owner())
  with check (public.is_admin() or public.is_owner());
drop policy if exists pay_req_admin_del on public.payment_requests;
create policy pay_req_admin_del on public.payment_requests for delete to authenticated
  using (public.is_admin() or public.is_owner());
grant select, insert, update, delete on public.payment_requests to authenticated;

create table if not exists public.login_ips(
  member_id uuid not null references public.profiles(id) on delete cascade,
  ip text not null,
  status text not null default 'pending' check (status in ('pending','approved','blocked')),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (member_id, ip)
);
alter table public.login_ips enable row level security;
create or replace function public.login_ips_ins_guard() returns trigger language plpgsql security definer set search_path=public as $fn$
begin
  if exists(select 1 from public.login_ips where member_id=new.member_id and status='approved') then
    new.status := 'pending';
  else
    new.status := 'approved';
  end if;
  return new;
end $fn$;
drop trigger if exists login_ips_ins_guard_t on public.login_ips;
create trigger login_ips_ins_guard_t before insert on public.login_ips for each row execute function public.login_ips_ins_guard();
create or replace function public.login_ips_upd_guard() returns trigger language plpgsql security definer set search_path=public as $fn$
begin
  if new.status is distinct from old.status and not public.is_app_admin() then
    new.status := old.status;
  end if;
  return new;
end $fn$;
drop trigger if exists login_ips_upd_guard_t on public.login_ips;
create trigger login_ips_upd_guard_t before update on public.login_ips for each row execute function public.login_ips_upd_guard();
drop policy if exists login_ips_select on public.login_ips;
create policy login_ips_select on public.login_ips for select to authenticated
  using (member_id=auth.uid() or public.is_app_admin());
drop policy if exists login_ips_insert on public.login_ips;
create policy login_ips_insert on public.login_ips for insert to authenticated with check (member_id=auth.uid());
drop policy if exists login_ips_update on public.login_ips;
create policy login_ips_update on public.login_ips for update to authenticated
  using (member_id=auth.uid() or public.is_app_admin()) with check (member_id=auth.uid() or public.is_app_admin());
grant select, insert, update on public.login_ips to authenticated;

create table if not exists public.audit_logs(
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text,
  entity text,
  entity_id text,
  meta jsonb,
  created_at timestamptz default now()
);
alter table public.audit_logs enable row level security;
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs for insert to authenticated with check (actor_id = auth.uid());
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select to authenticated
  using (public.is_admin() or public.is_owner());
grant select, insert on public.audit_logs to authenticated;

create or replace function public.bump_ai_usage() returns int language plpgsql security definer set search_path=public as $fn$
declare v int;
begin
  insert into public.ai_usage(member_id,usage_date,cnt) values(auth.uid(),current_date,1)
    on conflict (member_id,usage_date) do update set cnt=public.ai_usage.cnt+1
    returning cnt into v;
  return v;
end $fn$;
grant execute on function public.bump_ai_usage() to authenticated;

notify pgrst, 'reload schema';
