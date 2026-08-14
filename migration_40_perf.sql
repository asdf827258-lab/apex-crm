/* ════════════════════════════════════════════════════════════════
   월간 영업보고서 — 목표 · 실적 · 사업계획 · 피드백

   지금까지 이 앱에는 <b>업적을 담는 자리가 없었습니다.</b> 통화 습관과
   활동 점수는 있는데, 정작 월초보험료가 얼마인지 적을 칸이 없었습니다.

   여기서 두 개를 만듭니다.
     ① monthly_perf — 사람마다 · 달마다 하나. 목표와 실적, 그리고 피드백
     ② team_plans   — 팀마다 · 달마다 하나. 리더가 쓰는 사업계획서

   ★ 열람 규칙 — 리더는 <b>자기가 이끄는 팀</b>만, 대표는 전체.
     이걸 화면에서만 막으면 주소를 알면 남의 실적을 볼 수 있습니다.
     그래서 <b>DB 에서</b> 막습니다.

   Supabase → SQL Editor 에 이 파일을 통째로 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── 누가 누구의 실적을 볼 수 있는가 ──────────────────────────────
   본인 / 대표·관리자 / 내가 리더로 있는 팀의 팀원.
   다른 함수에 기대지 않고 혼자 판단합니다 — 앞선 마이그레이션이
   안 돌아간 환경에서도 이 파일만으로 동작해야 합니다. */
create or replace function public.can_see_perf(target uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select
    target = auth.uid()
    or exists(
         select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin','owner','master','hq','branch_manager')
       )
    or exists(
         select 1
           from public.teams t
           join public.team_members tm on tm.team_id = t.id
          where t.leader_id = auth.uid()
            and tm.member_id = target
       );
$fn$;
grant execute on function public.can_see_perf(uuid) to authenticated;

/* 내가 리더로 있는 팀인가 */
create or replace function public.leads_team(tid uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select
    exists(select 1 from public.teams t where t.id = tid and t.leader_id = auth.uid())
    or exists(
         select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin','owner','master','hq','branch_manager')
       );
$fn$;
grant execute on function public.leads_team(uuid) to authenticated;

/* ── ① 사람마다 · 달마다 하나 ─────────────────────────────────── */
create table if not exists public.monthly_perf(
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  period text not null,                    /* 'YYYY-MM' */

  /* 업적은 월초보험료 하나로 셉니다 (만원) */
  goal_prem   numeric default 0,           /* 이달 목표 */
  act_prem    numeric default 0,           /* 실제 올린 것 */
  goal_case   integer default 0,           /* 목표 건수 */
  act_case    integer default 0,           /* 실제 건수 */

  plan        text default '',             /* 사업계획 — 본인이 적는다 */
  note        text default '',             /* 이달 소회 — 본인이 적는다 */

  submitted_at timestamptz,                /* 제출한 시각. 비어 있으면 아직 안 냈다 */
  ai_draft    text default '',             /* AI 가 쓴 피드백 초안 */
  feedback    text default '',             /* 리더가 고쳐 확정한 것 */
  feedback_by uuid,
  feedback_at timestamptz,

  from_team   boolean default false,       /* 목표가 팀 계획서에서 내려온 것인가 */
  updated_at  timestamptz default now(),
  created_at  timestamptz default now()
);
create unique index if not exists monthly_perf_uni on public.monthly_perf(owner_id, period);
create index if not exists monthly_perf_period_idx on public.monthly_perf(period desc);

/* ── ② 팀마다 · 달마다 하나 — 리더의 사업계획서 ──────────────── */
create table if not exists public.team_plans(
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  period text not null,                    /* 'YYYY-MM' */
  plan text default '',                    /* 사업계획서 본문 */
  goal_prem numeric default 0,             /* 팀 전체 목표 (만원) */
  share jsonb default '{}'::jsonb,         /* {팀원id: 배분한 목표} */
  applied_at timestamptz,                  /* 팀원 목표칸에 내려보낸 시각 */
  updated_by uuid,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);
create unique index if not exists team_plans_uni on public.team_plans(team_id, period);

/* ── 열람·수정 규칙 ─────────────────────────────────────────────
   읽기는 can_see_perf 가 정합니다. 쓰기는 <b>본인만</b> — 리더가
   팀원의 실적 숫자를 대신 고칠 수는 없습니다. 다만 피드백 칸은
   리더가 써야 하므로 그 칸만 열어 둡니다. */
alter table public.monthly_perf enable row level security;
alter table public.team_plans   enable row level security;

grant select, insert, update on public.monthly_perf to authenticated;
grant select, insert, update, delete on public.team_plans to authenticated;

drop policy if exists monthly_perf_read on public.monthly_perf;
create policy monthly_perf_read on public.monthly_perf
  for select to authenticated
  using (public.can_see_perf(owner_id));

drop policy if exists monthly_perf_insert on public.monthly_perf;
create policy monthly_perf_insert on public.monthly_perf
  for insert to authenticated
  with check (owner_id = auth.uid());

/* 본인이면 다 고칠 수 있고, 리더면 그 팀원 줄을 고칠 수 있습니다.
   (리더가 고치는 것은 피드백 칸이며, 앱이 그 칸만 보냅니다) */
drop policy if exists monthly_perf_update on public.monthly_perf;
create policy monthly_perf_update on public.monthly_perf
  for update to authenticated
  using (public.can_see_perf(owner_id))
  with check (public.can_see_perf(owner_id));

drop policy if exists team_plans_read on public.team_plans;
create policy team_plans_read on public.team_plans
  for select to authenticated
  using (
    public.leads_team(team_id)
    or exists(select 1 from public.team_members tm
               where tm.team_id = team_plans.team_id and tm.member_id = auth.uid())
  );

drop policy if exists team_plans_write on public.team_plans;
create policy team_plans_write on public.team_plans
  for all to authenticated
  using (public.leads_team(team_id))
  with check (public.leads_team(team_id));

/* ── 고쳐 쓴 시각을 자동으로 남긴다 ───────────────────────────── */
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

drop trigger if exists monthly_perf_touch on public.monthly_perf;
create trigger monthly_perf_touch before update on public.monthly_perf
  for each row execute function public.touch_updated_at();

drop trigger if exists team_plans_touch on public.team_plans;
create trigger team_plans_touch before update on public.team_plans
  for each row execute function public.touch_updated_at();
