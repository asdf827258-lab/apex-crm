-- 08: 권한 재편 — 마스터(전체 조회) 역할 추가 (재실행 안전 · 기존 권한 손상 없음)
-- 역할 체계: member=담당자 · leader=지점장 · master=마스터(전체 조회) · admin=운영자(전체 권한)
-- 앱(db-crm)에서 운영자가 팀원 권한을 지정하며, 이 SQL은 '마스터'가 전체 데이터를 조회할 수 있게 RLS만 추가한다.

-- 1) role 허용값에 'master' 추가 (leader/member/admin 유지)
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin','master','leader','member'));

-- 2) 전체 조회 권한 판별 함수 — 운영자(admin) 또는 마스터(master)
create or replace function public.is_viewer_all()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','master') and active = true
  );
$$;
grant execute on function public.is_viewer_all() to authenticated;

-- 3) 마스터 = 전체 조회(읽기 전용). 쓰기(등록·수정·삭제)는 기존대로 운영자(admin)만.
--    기존 select 정책과 OR로 합쳐지므로(permissive) 담당자·지점장 접근은 그대로 유지된다.
drop policy if exists "dbs_master_select" on public.dbs;
create policy "dbs_master_select" on public.dbs
  for select to authenticated using (public.is_viewer_all());

drop policy if exists "calls_master_select" on public.calls;
create policy "calls_master_select" on public.calls
  for select to authenticated using (public.is_viewer_all());

-- (참고) attendance_select 는 이미 모든 로그인 사용자 조회 허용(using(true))이므로 마스터도 출근 현황을 봅니다.
-- (참고) profiles 는 active 행을 모두 조회 가능하므로 팀 관리 화면이 정상 동작합니다.
-- 권한 변경(운영자→팀원 role 지정)은 기존 profiles_admin_update 정책으로 운영자(admin)만 가능합니다.
