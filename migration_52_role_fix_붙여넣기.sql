/* APEX YUN PRO — 대표(branch_manager) 권한 고치기
   Supabase → SQL Editor 에 통째로 붙여 넣고 Run 하십시오.
   두 번 돌아도 탈이 없습니다 (create or replace · drop ... if exists).
   자세한 설명과 되돌리기는 migration_52_role_fix.sql 에 있습니다. */

create or replace function public.is_viewer_all()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
     where id = auth.uid()
       and role in ('admin','owner','master','hq','branch_manager')
       and coalesce(active, true) = true
  );
$$;

drop policy if exists clients_master_select on public.clients;
create policy clients_master_select
  on public.clients for select to authenticated
  using ( public.is_viewer_all() );

drop policy if exists saved_reports_master_select on public.saved_reports;
create policy saved_reports_master_select
  on public.saved_reports for select to authenticated
  using ( public.is_viewer_all() );

/* ── 돌린 뒤 이것도 같이 돌려 확인하십시오 ──────────────────────
   설계사(member) 줄이 전부 false 여야 합니다. */
select p.role as 역할,
       count(*) as 인원,
       bool_or(p.role in ('admin','owner'))                                as 관리자,
       bool_or(p.role in ('admin','owner','master','hq','branch_manager')) as 전부보기,
       bool_or(p.role = 'leader')                                          as 팀원보기
  from public.profiles p
 group by p.role
 order by 2 desc;
