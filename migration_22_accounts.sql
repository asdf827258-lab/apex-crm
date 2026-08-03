set search_path = public;

alter table public.profiles add column if not exists status text;
alter table public.profiles add column if not exists plan text;
alter table public.profiles add column if not exists workspace text default 'both';
alter table public.profiles add column if not exists active boolean default true;

create extension if not exists pgcrypto;

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

select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from auth.users u left join public.profiles p on p.id = u.id where p.id is null) as missing_profile;

notify pgrst, 'reload schema';
