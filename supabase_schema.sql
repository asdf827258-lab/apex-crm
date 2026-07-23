-- APEX DB CRM / Supabase SQL (서버형 · RLS · 자동기록)
-- Supabase Dashboard > SQL Editor에서 전체 실행하세요. 여러 번 실행해도 안전합니다(멱등).

create extension if not exists pgcrypto;

-- ============================================================
-- 1) 테이블
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'member' check (role in ('admin','member')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.dbs (
  id uuid primary key default gen_random_uuid(),
  assigned_date date not null default current_date,
  assigned_to uuid not null references public.profiles(id),
  report_name text not null default '보장분석 3DB',
  customer_name text not null,
  phone text,
  region text,
  memo text,
  created_by uuid references public.profiles(id) default auth.uid(),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  db_id uuid not null references public.dbs(id) on delete cascade,
  created_by uuid not null references public.profiles(id) default auth.uid(),
  updated_by uuid references public.profiles(id),
  call_at timestamptz not null default now(),
  result text not null check (result in ('부재','거절','상담')),
  first_call_issue boolean not null default false,
  appointment_at timestamptz,
  memo text,
  group_reported boolean not null default false,
  recording_delivered boolean not null default false,
  recording_delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 기존 프로젝트에도 신규 컬럼을 안전하게 추가(멱등)
alter table public.dbs   add column if not exists updated_by uuid references public.profiles(id);
alter table public.dbs   alter column created_by set default auth.uid();
alter table public.calls add column if not exists updated_by uuid references public.profiles(id);
alter table public.calls add column if not exists updated_at timestamptz not null default now();
alter table public.calls alter column created_by set default auth.uid();

create index if not exists dbs_assigned_to_idx on public.dbs(assigned_to);
create index if not exists calls_db_id_idx on public.calls(db_id);
create index if not exists calls_created_by_idx on public.calls(created_by);

-- ============================================================
-- 2) 함수 / 트리거
-- ============================================================

-- 회원가입 시 이름/이메일 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)),
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 생성 시 작성자/시간 자동 기록
create or replace function public.set_created_meta()
returns trigger
language plpgsql
as $$
begin
  if new.created_by is null then new.created_by := auth.uid(); end if;
  new.created_at := now();
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

-- 수정 시 마지막 수정자/시간 자동 기록
create or replace function public.set_updated_meta()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  new.created_by := old.created_by;   -- 작성자는 변경 불가
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists dbs_created_meta on public.dbs;
create trigger dbs_created_meta before insert on public.dbs
for each row execute procedure public.set_created_meta();
drop trigger if exists dbs_updated_meta on public.dbs;
create trigger dbs_updated_meta before update on public.dbs
for each row execute procedure public.set_updated_meta();

drop trigger if exists calls_created_meta on public.calls;
create trigger calls_created_meta before insert on public.calls
for each row execute procedure public.set_created_meta();
drop trigger if exists calls_updated_meta on public.calls;
create trigger calls_updated_meta before update on public.calls
for each row execute procedure public.set_updated_meta();

-- 관리자 여부 확인 함수
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

-- 담당자(비관리자)의 role/id 무단 변경 차단: 관리자는 active/name만 실질 변경
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- 브라우저 로그인 사용자(authenticated)에서 role 승격/강등 금지.
  -- auth.uid()가 null이면 SQL Editor/service_role 이므로 허용(최초 관리자 지정용).
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception '권한 변경은 관리자만 가능합니다.';
  end if;
  new.id := old.id;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update before update on public.profiles
for each row execute procedure public.guard_profile_update();

-- ============================================================
-- 3) RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.dbs enable row level security;
alter table public.calls enable row level security;

-- profiles: 로그인 사용자는 활성 프로필/본인/관리자 조회 가능
drop policy if exists "profiles_directory_select" on public.profiles;
create policy "profiles_directory_select"
on public.profiles for select
to authenticated
using (active = true or id = auth.uid() or public.is_admin());

-- profiles: 관리자는 담당자 활성/비활성·이름 수정 가능(권한 승격은 트리거가 차단)
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- dbs: 관리자는 전체, 담당자는 자신에게 배정된 DB만
drop policy if exists "dbs_select" on public.dbs;
create policy "dbs_select"
on public.dbs for select
to authenticated
using (public.is_admin() or assigned_to = auth.uid());

drop policy if exists "dbs_admin_insert" on public.dbs;
create policy "dbs_admin_insert"
on public.dbs for insert
to authenticated
with check (public.is_admin());

drop policy if exists "dbs_admin_update" on public.dbs;
create policy "dbs_admin_update"
on public.dbs for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "dbs_admin_delete" on public.dbs;
create policy "dbs_admin_delete"
on public.dbs for delete
to authenticated
using (public.is_admin());

-- calls: 관리자는 전체, 담당자는 자신의 배정 DB 통화만
drop policy if exists "calls_select" on public.calls;
create policy "calls_select"
on public.calls for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.dbs d
    where d.id = calls.db_id and d.assigned_to = auth.uid()
  )
);

drop policy if exists "calls_insert" on public.calls;
create policy "calls_insert"
on public.calls for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.is_admin()
    or exists (
      select 1 from public.dbs d
      where d.id = calls.db_id and d.assigned_to = auth.uid()
    )
  )
);

drop policy if exists "calls_update" on public.calls;
create policy "calls_update"
on public.calls for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.dbs d
    where d.id = calls.db_id and d.assigned_to = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.dbs d
    where d.id = calls.db_id and d.assigned_to = auth.uid()
  )
);

drop policy if exists "calls_delete" on public.calls;
create policy "calls_delete"
on public.calls for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- 4) 최초 관리자 지정 (가입 후 1회, 이메일만 바꿔 실행)
-- ============================================================
-- update public.profiles p set role='admin'
-- from auth.users u
-- where p.id = u.id and u.email = 'YOUR_ADMIN_EMAIL@example.com';
