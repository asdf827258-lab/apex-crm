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

   ── ③ 건별 목표업적 ──────────────────────────────────────────────
   사람별 월 목표와는 <b>다른 것</b>입니다. 줄마다 「이 건에서 얼마를
   올리자」를 적습니다. 돈 칸은 세우는 순서대로 섭니다.

     target_premium   — 목표. 「이만큼 올리자」
     expect_premium   — 예상. 「지금 설계로는 이만큼」
     contract_premium — 계약. 「실제로 이만큼 됐다」

   한 칸에 뭉치면 셋 다 잃습니다.

   Supabase → SQL Editor 에 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── ③ 건별 목표업적 ─────────────────────────────────────────────── */
do $blk$
begin
  if to_regclass('public.dbs') is null then return; end if;
  alter table public.dbs add column if not exists target_premium integer;
  comment on column public.dbs.target_premium is
    '이 건의 목표 월납(원) — 세우는 순서는 목표 → 예상 → 계약. 사람별 월 목표(monthly_perf.goal_prem)와는 다른 것';
end
$blk$;

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

/* ── ③ 진행 칸만 고치는 문 — 목록에 target_premium 을 더한다 ────────
   migration_50 의 것을 그대로 다시 낸다. 여기 없는 칸은 이 문으로 못
   고친다 — phone·assigned_to 는 계속 막힌다. */
create or replace function public.pipeline_save(p_id uuid, p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare owner_id uuid;
begin
  select assigned_to into owner_id from public.dbs where id = p_id;
  if owner_id is null then
    raise exception '없는 건입니다';
  end if;
  if not public.pipeline_can_edit(owner_id) then
    raise exception '내 팀이 아닌 건은 고칠 수 없습니다';
  end if;

  update public.dbs set
    region           = case when p ? 'region'           then nullif(p->>'region','')                              else region end,
    customer_name    = case when p ? 'customer_name'    then coalesce(nullif(p->>'customer_name',''),customer_name) else customer_name end,
    source           = case when p ? 'source'           then coalesce(nullif(p->>'source',''),source)             else source end,
    assigned_date    = case when p ? 'assigned_date'    then coalesce(nullif(p->>'assigned_date','')::date,assigned_date) else assigned_date end,
    stage            = case when p ? 'stage'            then coalesce(nullif(p->>'stage',''),stage)               else stage end,
    next_appt        = case when p ? 'next_appt'        then nullif(p->>'next_appt','')::timestamptz              else next_appt end,
    target_premium   = case when p ? 'target_premium'   then nullif(p->>'target_premium','')::integer             else target_premium end,
    expect_premium   = case when p ? 'expect_premium'   then nullif(p->>'expect_premium','')::integer             else expect_premium end,
    contract_premium = case when p ? 'contract_premium' then nullif(p->>'contract_premium','')::integer           else contract_premium end,
    family_intro     = case when p ? 'family_intro'     then nullif(p->>'family_intro','')                        else family_intro end,
    intro_count      = case when p ? 'intro_count'      then nullif(p->>'intro_count','')::integer                else intro_count end,
    closed_reason    = case when p ? 'closed_reason'    then nullif(p->>'closed_reason','')                       else closed_reason end,
    memo             = case when p ? 'memo'             then nullif(p->>'memo','')                                else memo end,
    contracted_at    = case when p ? 'contracted_at'    then nullif(p->>'contracted_at','')::timestamptz          else contracted_at end,
    policy_sent_at   = case when p ? 'policy_sent_at'   then nullif(p->>'policy_sent_at','')::timestamptz         else policy_sent_at end,
    updated_at       = now(),
    updated_by       = auth.uid()
  where id = p_id;
end
$fn$;

create or replace function public.pipeline_new(p_to uuid, p jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare new_id uuid;
begin
  if p_to is null then raise exception '담당자가 없습니다'; end if;
  if not public.pipeline_can_edit(p_to) then
    raise exception '내 팀이 아닌 사람에게는 만들 수 없습니다';
  end if;

  insert into public.dbs
    (assigned_to, assigned_date, customer_name, report_name, source, stage,
     region, memo, next_appt, target_premium, expect_premium, contract_premium,
     family_intro, intro_count, closed_reason, created_by, updated_by)
  values
    (p_to,
     coalesce(nullif(p->>'assigned_date','')::date, current_date),
     coalesce(nullif(p->>'customer_name',''), '이름없음'),
     '진행관리',
     coalesce(nullif(p->>'source',''), '일반'),
     coalesce(nullif(p->>'stage',''), '미접촉'),
     nullif(p->>'region',''),
     nullif(p->>'memo',''),
     nullif(p->>'next_appt','')::timestamptz,
     nullif(p->>'target_premium','')::integer,
     nullif(p->>'expect_premium','')::integer,
     nullif(p->>'contract_premium','')::integer,
     nullif(p->>'family_intro',''),
     nullif(p->>'intro_count','')::integer,
     nullif(p->>'closed_reason',''),
     auth.uid(), auth.uid())
  returning id into new_id;

  return new_id;
end
$fn$;

revoke all on function public.pipeline_delete(uuid)                    from public;
revoke all on function public.pipeline_goals(text)                     from public;
revoke all on function public.pipeline_goal_set(uuid, text, numeric)   from public;
grant execute on function public.pipeline_delete(uuid)                  to authenticated;
grant execute on function public.pipeline_goals(text)                   to authenticated;
grant execute on function public.pipeline_goal_set(uuid, text, numeric) to authenticated;
