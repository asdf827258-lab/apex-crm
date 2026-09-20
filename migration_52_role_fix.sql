/* ════════════════════════════════════════════════════════════════
   대표(branch_manager)가 고객·DB·통화를 「자기 것만」 보던 것

   2026-09-19 에 역할별로 무엇이 보이는지 한 장으로 맞춰 보다 찾았습니다.

     역할             인원   고객        배정DB      통화        실적
     member           24    자기 것만   자기 것만   자기 것만   자기 것만
     leader            5    팀원        팀원        팀원        자기 팀
     admin             3    전부        전부        전부        전부
     master            2    자기 것만   전부        전부        전부
     branch_manager    1    자기 것만   자기 것만   자기 것만   전부

   설계사가 자기 것만 보는 것은 <b>맞습니다</b> — 그대로 둡니다.
   문제는 <b>매니저 쪽</b>입니다. 판정 함수 넷 어디에도 branch_manager 가
   없어서, 대표가 실적·팀계획은 전부 보는데 정작 <b>고객과 DB 는 자기
   것만</b> 봅니다. can_see_perf 와 leads_team 은 이미
   ('admin','owner','master','hq','branch_manager') 를 쓰고 있으니,
   <b>다른 함수만 그 명단을 못 따라간 것</b>입니다.

   ── 고치는 것 ─────────────────────────────────────────────────
     1) is_viewer_all() 에 'hq' · 'branch_manager' 를 넣는다
        → dbs_master_select · calls_master_select 가 이미 이 함수를
          쓰므로, <b>이 한 줄로 DB 와 통화가 함께 풀립니다.</b>
     2) clients 에는 그 길이 <b>아예 없었습니다</b> — 새로 하나 놓습니다.
     3) saved_reports 도 같습니다 (보장분석 리포트).

   ── 일부러 <b>안</b> 건드린 것 ───────────────────────────────────
     · is_my_teammate() — 설계사 격리가 여기 걸려 있습니다. 손대면
       설계사가 남의 고객을 보게 됩니다. 그대로 둡니다.
     · is_leader() — 이 함수는 다른 자리에서도 쓰입니다. 위 1)만으로
       이번 문제가 풀리므로 넓히지 않습니다.
     · clients 의 <b>고치기·지우기</b>(update·delete) — 읽기만 엽니다.
       대표가 남의 고객을 고칠 일은 없습니다.

   되돌리려면 이 파일 맨 아래 「되돌리기」 를 그대로 돌리십시오.
   ════════════════════════════════════════════════════════════════ */

/* ── 1) 「전부 보는 사람」 명단에 대표를 넣는다 ──────────────────
   can_see_perf · leads_team 이 이미 쓰는 명단과 같게 맞춥니다.        */
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

/* ── 2) 고객 표 — 「전부 보는 사람」 길을 새로 놓는다 ────────────
   지금 있는 clients_read 는 <b>손대지 않습니다.</b> 정책은 여러 개가
   OR 로 더해지므로, 새로 하나 놓는 쪽이 안전합니다 — 기존 줄을 다시
   쓰다 한 글자를 틀리면 설계사 격리가 통째로 풀립니다.               */
drop policy if exists clients_master_select on public.clients;
create policy clients_master_select
  on public.clients for select to authenticated
  using ( public.is_viewer_all() );

/* ── 3) 보장분석 리포트도 같은 길 ─────────────────────────────── */
drop policy if exists saved_reports_master_select on public.saved_reports;
create policy saved_reports_master_select
  on public.saved_reports for select to authenticated
  using ( public.is_viewer_all() );

/* ── 확인 ──────────────────────────────────────────────────────
   돌린 뒤 이것을 돌리면 역할마다 무엇이 열렸는지 한 장으로 보입니다.
   설계사(member) 줄이 <b>전부 false</b> 여야 합니다 — 그것이 안 바뀌는
   것이 이 마이그레이션의 조건입니다.

   with r(역할) as (values ('member'),('leader'),('admin'),('master'),('branch_manager'))
   select r.역할,
          (r.역할 in ('admin','owner'))                                as is_admin,
          (r.역할 in ('admin','owner','master','hq','branch_manager')) as is_viewer_all,
          (r.역할 = 'leader')                                          as is_my_teammate
   from r;

   ── 되돌리기 ─────────────────────────────────────────────────
   drop policy if exists clients_master_select on public.clients;
   drop policy if exists saved_reports_master_select on public.saved_reports;
   create or replace function public.is_viewer_all()
   returns boolean language sql stable security definer set search_path = public
   as $$
     select exists(
       select 1 from public.profiles
        where id = auth.uid() and role in ('admin','owner','master')
          and coalesce(active,true) = true );
   $$;
   ══════════════════════════════════════════════════════════════ */
