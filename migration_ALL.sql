set search_path = public;

create table if not exists public.app_config(
  key text primary key,
  value text,
  updated_at timestamptz default now()
);
alter table public.app_config enable row level security;
drop policy if exists app_config_select on public.app_config;
create policy app_config_select on public.app_config for select to authenticated using (true);
grant select, insert, update, delete on public.app_config to authenticated;

alter table public.profiles add column if not exists status text;
alter table public.profiles add column if not exists plan text;
alter table public.profiles add column if not exists plan_until timestamptz;
alter table public.profiles add column if not exists workspace text default 'both';
alter table public.profiles add column if not exists active boolean default true;

create extension if not exists pgcrypto;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists(
    select 1 from public.profiles
     where id = auth.uid() and role in ('admin','owner')
  );
$fn$;

create or replace function public.is_owner()
returns boolean language plpgsql stable security definer set search_path = public as $fn$
declare oe text; me text;
begin
  begin
    select value into oe from public.app_config where key = 'owner_email' limit 1;
  exception when others then
    oe := null;
  end;
  select email into me from auth.users where id = auth.uid();
  if oe is null or oe = '' then
    return exists(select 1 from public.profiles
                   where id = auth.uid() and role in ('admin','owner'));
  end if;
  return me is not null and lower(me) = lower(oe);
end;
$fn$;

create or replace function public.is_leader()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists(
    select 1 from public.profiles
     where id = auth.uid() and coalesce(active,true) = true
       and role in ('admin','owner','lead','manager','leader','master')
  ) or public.is_owner();
$fn$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.is_leader() to authenticated;

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

create or replace function public.admin_user_list()
returns table(
  id uuid,
  email text,
  name text,
  role text,
  status text,
  plan text,
  workspace text,
  active boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  confirmed boolean
)
language plpgsql
security definer
set search_path = public, auth
as $fn$
begin
  if not (public.is_admin() or public.is_owner()) then
    raise exception '관리자만 계정 목록을 볼 수 있습니다';
  end if;
  return query
  select u.id,
         u.email::text,
         coalesce(nullif(btrim(p.name), ''), split_part(coalesce(u.email, ''), '@', 1))::text,
         coalesce(p.role, 'member')::text,
         coalesce(p.status, 'approved')::text,
         p.plan::text,
         coalesce(p.workspace, 'both')::text,
         coalesce(p.active, true),
         u.created_at,
         u.last_sign_in_at,
         (u.email_confirmed_at is not null)
    from auth.users u
    left join public.profiles p on p.id = u.id
   order by u.created_at desc;
end
$fn$;

create or replace function public.admin_account_refs(target uuid)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $fn$
declare
  t text;
  c text;
  n integer;
  total integer := 0;
begin
  if not (public.is_admin() or public.is_owner()) then
    raise exception '관리자만 확인할 수 있습니다';
  end if;
  for t, c in
    select k.table_name, k.column_name
      from information_schema.columns k
     where k.table_schema = 'public'
       and k.column_name in ('advisor_id', 'author_id', 'member_id', 'user_id', 'owner_id', 'created_by', 'assignee_id')
  loop
    begin
      execute format('select count(*) from public.%I where %I = $1', t, c) into n using target;
      total := total + coalesce(n, 0);
    exception when others then
      null;
    end;
  end loop;
  return total;
end
$fn$;

create or replace function public.admin_set_temp_password(target uuid, newpw text)
returns text
language plpgsql
security definer
set search_path = public, auth, extensions
as $fn$
declare
  em text;
begin
  if not public.is_owner() then
    raise exception '대표만 임시 비밀번호를 발급할 수 있습니다';
  end if;
  if target = auth.uid() then
    raise exception '본인 비밀번호는 로그인 화면의 비밀번호 재설정으로 바꾸세요';
  end if;
  if length(coalesce(newpw, '')) < 8 then
    raise exception '임시 비밀번호는 8자 이상이어야 합니다';
  end if;
  select u.email into em from auth.users u where u.id = target;
  if em is null then
    raise exception '없는 계정입니다';
  end if;
  update auth.users
     set encrypted_password = crypt(newpw, gen_salt('bf', 10)),
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at = now()
   where id = target;
  return em;
end
$fn$;

create or replace function public.admin_set_active(target uuid, v boolean)
returns text
language plpgsql
security definer
set search_path = public, auth
as $fn$
declare
  em text;
begin
  if not (public.is_admin() or public.is_owner()) then
    raise exception '관리자만 변경할 수 있습니다';
  end if;
  if target = auth.uid() then
    raise exception '본인 계정은 여기서 잠글 수 없습니다';
  end if;
  select u.email into em from auth.users u where u.id = target;
  if em is null then
    raise exception '없는 계정입니다';
  end if;
  update public.profiles
     set active = v,
         status = case when v then 'approved' else 'blocked' end
   where id = target;
  return em;
end
$fn$;

create or replace function public.admin_delete_account(target uuid, hard boolean default false)
returns text
language plpgsql
security definer
set search_path = public, auth
as $fn$
declare
  em text;
  oe text;
  refs integer;
begin
  if not public.is_owner() then
    raise exception '대표만 계정을 삭제할 수 있습니다';
  end if;
  if target = auth.uid() then
    raise exception '본인 계정은 삭제할 수 없습니다';
  end if;
  select u.email into em from auth.users u where u.id = target;
  if em is null then
    raise exception '없는 계정입니다';
  end if;
  select value into oe from public.app_config where key = 'owner_email' limit 1;
  if oe is not null and lower(btrim(em)) = lower(btrim(oe)) then
    raise exception '대표 계정은 삭제할 수 없습니다';
  end if;
  refs := public.admin_account_refs(target);
  if refs > 0 and not hard then
    raise exception '이 계정에 연결된 기록이 %건 있습니다. 삭제하면 그 기록이 함께 사라집니다', refs;
  end if;
  delete from public.profiles where id = target;
  delete from auth.users where id = target;
  return em;
end
$fn$;

revoke execute on function public.admin_user_list() from public;
revoke execute on function public.admin_account_refs(uuid) from public;
revoke execute on function public.admin_set_temp_password(uuid, text) from public;
revoke execute on function public.admin_set_active(uuid, boolean) from public;
revoke execute on function public.admin_delete_account(uuid, boolean) from public;

grant execute on function public.admin_user_list() to authenticated;
grant execute on function public.admin_account_refs(uuid) to authenticated;
grant execute on function public.admin_set_temp_password(uuid, text) to authenticated;
grant execute on function public.admin_set_active(uuid, boolean) to authenticated;
grant execute on function public.admin_delete_account(uuid, boolean) to authenticated;

create table if not exists public.org_members(
  id text primary key,
  name text not null default '',
  rank text default '설계사',
  team text default '',
  parent text default '',
  phone text default '',
  insta text default '',
  photo text default '',
  updated_at timestamptz default now(),
  updated_by uuid
);

alter table public.org_members add column if not exists updated_at timestamptz default now();
alter table public.org_members add column if not exists updated_by uuid;
alter table public.org_members enable row level security;

drop policy if exists org_members_read on public.org_members;
create policy org_members_read on public.org_members
  for select to authenticated using (true);

drop policy if exists org_members_write on public.org_members;
create policy org_members_write on public.org_members
  for all to authenticated
  using (public.is_admin() or public.is_owner())
  with check (public.is_admin() or public.is_owner());

grant select on public.org_members to authenticated;
grant insert, update, delete on public.org_members to authenticated;

create table if not exists public.daily_checks(
  member_id uuid not null,
  check_date date not null,
  scope text not null default 'day',
  items jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  primary key (member_id, check_date, scope)
);

alter table public.daily_checks add column if not exists items jsonb not null default '{}'::jsonb;
alter table public.daily_checks add column if not exists updated_at timestamptz default now();

create index if not exists daily_checks_date_idx on public.daily_checks(check_date desc);
create index if not exists daily_checks_member_idx on public.daily_checks(member_id);

alter table public.daily_checks enable row level security;

drop policy if exists daily_checks_read on public.daily_checks;
create policy daily_checks_read on public.daily_checks
  for select to authenticated
  using (
    member_id = auth.uid()
    or public.is_leader()
    or public.is_admin()
    or public.is_owner()
  );

drop policy if exists daily_checks_insert on public.daily_checks;
create policy daily_checks_insert on public.daily_checks
  for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists daily_checks_update on public.daily_checks;
create policy daily_checks_update on public.daily_checks
  for update to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

drop policy if exists daily_checks_delete on public.daily_checks;
create policy daily_checks_delete on public.daily_checks
  for delete to authenticated
  using (member_id = auth.uid() or public.is_admin() or public.is_owner());

grant select on public.daily_checks to authenticated;
grant insert, update, delete on public.daily_checks to authenticated;

notify pgrst, 'reload schema';

select
  to_regclass('public.daily_checks') is not null as 실행체크판,
  to_regclass('public.org_members')  is not null as 조직도,
  (select count(*) from public.profiles where plan is not null and btrim(plan) <> '') as 등급받은사람,
  (select count(*) from public.profiles where plan is null or btrim(plan) = '') as 등급없는사람,
  (select count(*) from pg_proc where proname like 'admin\_%') as 계정관리함수;
