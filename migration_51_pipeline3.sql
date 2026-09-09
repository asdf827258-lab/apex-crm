/* ════════════════════════════════════════════════════════════════
   지울 수 있게 · 목표업적을 여기서도 적을 수 있게

   ── ① 지우기 ─────────────────────────────────────────────────────
   진행관리 화면에서 잘못 만든 줄을 지울 데가 없었습니다. 다만 이 줄은
   <b>DB 통합 CRM 의 그 고객</b>입니다. 지우면 통화 기록도 배정 이력도
   같이 사라집니다. 그래서 문을 따로 내고, 고칠 수 있는 사람만 지울 수
   있게 합니다(pipeline_can_edit — 관리자 · 본인 · 내 팀).

   <b>「무산」으로 두는 것이 먼저입니다.</b> 결번·허수도 몇 건이었는지
   남아야 다음 달 DB 를 몇 개 받을지 말할 수 있습니다. 지우면 그 숫자가
   없던 일이 됩니다. 화면에서도 그렇게 묻습니다.

   ── ② 목표업적 ───────────────────────────────────────────────────
   <b>새 표를 만들지 않습니다.</b> 목표는 이미 monthly_perf.goal_prem
   (「내 업적 · 월간보고」의 <b>목표 월초보험료</b>, 단위 <b>만원</b>)에
   있고 8월엔 24명 전원이 적어 두셨습니다. 같은 것을 두 곳에 적으시게
   만들면 반드시 어긋납니다. 그 자리를 그대로 읽고 씁니다.

   ⚠ 기존 권한 함수 can_see_perf() 는 팀장을 <b>teams.leader_id</b> 로
   가립니다. 그런데 지금 <b>모든 팀의 leader_id 가 비어 있어서</b> 팀장은
   팀원 목표를 보지도 쓰지도 못합니다. 설정에서 팀장을 지정하시면 풀리는
   문제지만, 그때까지 화면이 멈추면 안 되므로 여기서는 pipeline_can_edit
   (team_members 기준) 으로 봅니다. 지정하시면 양쪽 다 됩니다.

   Supabase → SQL Editor 에 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── ① 지우기 ──────────────────────────────────────────────────── */
create or replace function public.pipeline_delete(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare owner_id uuid;
begin
  select assigned_to into owner_id from public.dbs where id = p_id;
  if owner_id is null then
    return;                       /* 이미 없다 — 조용히 끝낸다 */
  end if;
  if not public.pipeline_can_edit(owner_id) then
    raise exception '내 팀이 아닌 건은 지울 수 없습니다';
  end if;
  delete from public.dbs where id = p_id;
end
$fn$;

/* ── ② 목표업적 읽기 ───────────────────────────────────────────────
   내가 고칠 수 있는 사람들의 그 달 목표를 한 번에 준다.
   단위는 monthly_perf 그대로 <b>만원</b>이다 — 화면에서 원으로 바꾼다. */
create or replace function public.pipeline_goals(p_period text)
returns table(owner_id uuid, goal_prem numeric)
language sql
stable
security definer
set search_path = public
as $fn$
  select m.owner_id, m.goal_prem
  from public.monthly_perf m
  where m.period = p_period
    and public.pipeline_can_edit(m.owner_id);
$fn$;

/* ── ② 목표업적 쓰기 ─────────────────────────────────────────────
   있으면 고치고 없으면 만든다. goal_prem 하나만 건드린다 —
   실적(act_prem)·계획(plan)·피드백은 「내 업적 · 월간보고」의 것이다. */
create or replace function public.pipeline_goal_set(p_owner uuid, p_period text, p_goal numeric)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if p_owner is null or p_period !~ '^\d{4}-\d{2}$' then
    raise exception '담당자나 기준 월이 잘못됐습니다';
  end if;
  if not public.pipeline_can_edit(p_owner) then
    raise exception '내 팀이 아닌 사람의 목표는 적을 수 없습니다';
  end if;

  update public.monthly_perf
     set goal_prem = coalesce(p_goal, 0), updated_at = now()
   where owner_id = p_owner and period = p_period;

  if not found then
    insert into public.monthly_perf (owner_id, period, goal_prem)
    values (p_owner, p_period, coalesce(p_goal, 0));
  end if;
end
$fn$;

revoke all on function public.pipeline_delete(uuid)                    from public;
revoke all on function public.pipeline_goals(text)                     from public;
revoke all on function public.pipeline_goal_set(uuid, text, numeric)   from public;
grant execute on function public.pipeline_delete(uuid)                  to authenticated;
grant execute on function public.pipeline_goals(text)                   to authenticated;
grant execute on function public.pipeline_goal_set(uuid, text, numeric) to authenticated;
