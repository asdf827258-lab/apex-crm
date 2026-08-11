/* ════════════════════════════════════════════════════════════════
   본부장 · 교육매니저 역할을 실제로 저장할 수 있게 한다

   설정 → 팀원 권한 관리에서 이 두 역할을 고르면 저장이 실패했다.
   화면에는 있는데 데이터베이스가 받지 않았기 때문이다.

   지금 걸려 있는 제약:
     role in ('admin','owner','master','manager','lead','leader','member')

   branch_manager 와 education_manager 가 빠져 있어서
   "violates check constraint profiles_role_check" 로 거절됐다.

   이 파일은 몇 번을 다시 실행해도 안전하다.
   ════════════════════════════════════════════════════════════════ */

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles add constraint profiles_role_check
  check (role in (
    'admin','owner','master','manager','lead','leader','member',
    'branch_manager','education_manager'
  ));

/* 팀 전체를 볼 수 있는 역할에 본부장·교육매니저를 넣는다.
   이 함수가 없으면 지점장이 팀원 기록을 못 읽는다. */
create or replace function public.is_team_viewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin','owner','lead','manager','leader','master',
                   'branch_manager','education_manager')
  );
$$;

grant execute on function public.is_team_viewer() to authenticated;

/* 관리자 판정에는 본부장까지만 넣는다.
   교육매니저는 팀을 보되 설정을 바꾸지는 못한다. */
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin','owner','branch_manager')
  );
$$;

grant execute on function public.is_admin() to authenticated;
