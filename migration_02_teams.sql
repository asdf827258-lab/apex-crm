-- APEX DB CRM / 팀 관리 마이그레이션 (2단계)
-- 기존 프로젝트에 안전하게 추가됩니다. 여러 번 실행해도 됩니다(멱등).
-- Supabase Dashboard > SQL Editor에서 전체 실행하세요.

-- ============================================================
-- 1) teams 테이블
-- ============================================================
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2) profiles: 팀 소속 + 팀장(leader) 역할 허용
-- ============================================================
alter table public.profiles add column if not exists team_id uuid references public.teams(id) on delete set null;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin','leader','member'));

create index if not exists profiles_team_idx on public.profiles(team_id);

-- ============================================================
-- 3) 헬퍼 함수 (SECURITY DEFINER: RLS 재귀 방지)
-- ============================================================
create or replace function public.my_team()
returns uuid language sql stable security definer set search_path = public as $$
  select team_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_leader()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'leader' and active = true and team_id is not null
  );
$$;

-- target(담당자)이 로그인한 팀장의 같은 팀 소속인지
create or replace function public.is_my_teammate(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1
    from public.profiles me
    join public.profiles t on t.team_id = me.team_id
    where me.id = auth.uid()
      and me.role = 'leader' and me.active = true and me.team_id is not null
      and t.id = target
  );
$$;

-- ============================================================
-- 4) teams RLS: 조회는 로그인 사용자 전체, 변경은 관리자만
-- ============================================================
alter table public.teams enable row level security;

drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams for select to authenticated using (true);

drop policy if exists teams_admin_write on public.teams;
create policy teams_admin_write on public.teams for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 5) dbs / calls 조회정책에 '팀장은 팀원 데이터 조회' 추가
-- ============================================================
drop policy if exists "dbs_select" on public.dbs;
create policy "dbs_select" on public.dbs for select to authenticated
using (
  public.is_admin()
  or assigned_to = auth.uid()
  or public.is_my_teammate(assigned_to)
);

drop policy if exists "calls_select" on public.calls;
create policy "calls_select" on public.calls for select to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.dbs d where d.id = calls.db_id and d.assigned_to = auth.uid())
  or exists (select 1 from public.dbs d where d.id = calls.db_id and public.is_my_teammate(d.assigned_to))
);

-- 주의: DB 등록/수정/삭제, TA 입력 권한은 그대로입니다.
--  - DB 등록·수정·재배정·삭제: 관리자만
--  - TA(통화) 입력: 배정된 담당자 본인(또는 관리자)
--  - 팀장: 자기 팀의 DB/TA를 '조회'하고 팀 통계를 봅니다.
