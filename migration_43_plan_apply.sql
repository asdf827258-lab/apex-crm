/* ════════════════════════════════════════════════════════════════
   사업계획서의 「저장하고 팀원에게 적용」 이 안 먹던 것

   증상 — 리더가 팀원별로 목표를 나눠 적고 「📥 저장하고 팀원에게 적용」
   을 눌러도 팀원 화면의 목표칸이 그대로다.

   원인 — monthly_perf 의 넣기(insert) 규칙이 <b>본인 줄만</b> 허용하고
   있었다.

       with check (owner_id = auth.uid())

   앱은 팀원 줄을 upsert(있으면 고치고 없으면 넣기) 로 쓴다. 그런데
   포스트그레스는 이 경우 <b>실제로 넣는 줄에만</b> insert 규칙을 본다.

       팀원 줄이 이미 있다  → 고치기 규칙(can_see_perf) → 리더 통과 ○
       팀원 줄이 아직 없다  → 넣기 규칙(본인만)        → 리더 거절 ×

   그래서 <b>그 달 첫 적용은 반드시 실패</b>했다. 달이 바뀌면 팀원 줄이
   없으니 또 실패한다. 매달 초, 정작 필요할 때만 안 되는 셈이었다.

   고침 — 넣기 규칙을 고치기 규칙과 같은 것으로 맞춘다. 리더는 이미
   팀원 줄을 <b>고칠</b> 수 있었으므로, 없는 줄을 <b>만들</b> 수 있게 해도
   볼 수 있는 범위는 하나도 넓어지지 않는다.

   앞선 마이그레이션이 안 돌아간 환경에서도 이 파일만으로 동작해야
   하므로 필요한 것을 전부 다시 만든다.
   Supabase → SQL Editor 에 통째로 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── 누가 누구의 실적을 볼 수 있는가 ─────────────────────────────
   본인 / 대표·관리자 / 내가 리더로 있는 팀의 팀원 */
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

/* ── 담을 자리 (migration_40_perf.sql 을 안 돌렸어도 여기서 생긴다) ── */
create table if not exists public.monthly_perf(
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  period text not null,
  goal_prem   numeric default 0,
  act_prem    numeric default 0,
  goal_case   integer default 0,
  act_case    integer default 0,
  plan        text default '',
  note        text default '',
  submitted_at timestamptz,
  ai_draft    text default '',
  feedback    text default '',
  feedback_by uuid,
  feedback_at timestamptz,
  from_team   boolean default false,
  updated_at  timestamptz default now(),
  created_at  timestamptz default now()
);
create unique index if not exists monthly_perf_uni on public.monthly_perf(owner_id, period);
create index if not exists monthly_perf_period_idx on public.monthly_perf(period desc);

create table if not exists public.team_plans(
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  period text not null,
  plan text default '',
  goal_prem numeric default 0,
  share jsonb default '{}'::jsonb,
  applied_at timestamptz,
  updated_by uuid,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);
create unique index if not exists team_plans_uni on public.team_plans(team_id, period);

alter table public.monthly_perf enable row level security;
alter table public.team_plans   enable row level security;

grant select, insert, update on public.monthly_perf to authenticated;
grant select, insert, update, delete on public.team_plans to authenticated;

/* ── ★ 여기가 고친 곳 ──────────────────────────────────────────
   리더가 팀원의 이달 줄을 <b>만들</b> 수 있어야 「적용」 이 첫 달에도 된다.
   고치기 규칙과 같은 잣대(can_see_perf)를 쓰므로 남의 팀은 여전히 못 건드린다.
   can_see_perf 안에 "본인" 도 들어 있으니 팀원이 자기 줄을 만드는 것도 그대로다. */
drop policy if exists monthly_perf_insert on public.monthly_perf;
create policy monthly_perf_insert on public.monthly_perf
  for insert to authenticated
  with check (public.can_see_perf(owner_id));

/* 나머지는 원래대로 다시 세운다 */
drop policy if exists monthly_perf_read on public.monthly_perf;
create policy monthly_perf_read on public.monthly_perf
  for select to authenticated
  using (public.can_see_perf(owner_id));

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
