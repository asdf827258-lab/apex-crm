/* ════════════════════════════════════════════════════════════════
   계약업적 · 소개 인원 두 칸, 그리고 「팀」을 설정 쪽으로 맞추기

   ── ① 칸 둘 ──────────────────────────────────────────────────────
   예상업적만 있고 <b>실제로 얼마에 체결됐는지</b> 적을 데가 없었습니다.
   예상은 예상대로 두어야 다음 달 예측이 맞고, 계약은 계약대로 남아야
   업적이 맞습니다. 한 칸에 덮어쓰면 둘 다 잃습니다.

     contract_premium — 계약 월납(원). 체결되고 나서 적는다
     intro_count      — 이 고객에게서 소개받은 사람 수

   ── ② 팀이 세 곳에 적혀 있었다 ──────────────────────────────────
   is_my_teammate() 는 profiles.team_id 를 봅니다. 그런데 사장님이
   실제로 지정하시는 곳은 <b>설정 → 팀원 권한 관리(team_members)</b> 이고,
   profiles.team_id 는 2026-07-23 에 멈춰 있습니다. 그래서 팀장이 보는
   범위가 <b>7월 조직</b>으로 굳어 있었습니다.

     박세빈  상승지점(옛)  →  세빈TEAM(설정)
     심상빈  APEX 직할     →  상빈TEAM
     윤건우  APEX 직할     →  건우TEAM
     한현준  APEX 직할     →  현준TEAM

   윤건우 팀장은 APEX 직할 11명이 전부 자기 팀원으로 보이고, 정작
   건우TEAM 4명 중 직할이 아닌 사람은 안 보입니다. 화면을 아무리 고쳐도
   서버가 그렇게 답하면 소용이 없습니다.

   <b>아래 ② 블록은 기본으로 꺼 두었습니다.</b> dbs 뿐 아니라 이 함수를
   쓰는 화면 전부의 보이는 범위가 같이 바뀌기 때문입니다. 사장님이
   「설정한 대로 보이게 하라」 하시면 그때 주석을 벗기고 실행하십시오.
   ①만 실행해도 이 화면은 정상으로 돕니다 — 화면 쪽은 이미 team_members
   를 먼저 읽도록 고쳤습니다.

   Supabase → SQL Editor 에 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

/* ── ① 칸 둘 ───────────────────────────────────────────────────── */
do $blk$
begin
  if to_regclass('public.dbs') is null then
    raise notice 'dbs 표가 없습니다 — 건너뜁니다';
    return;
  end if;
  alter table public.dbs add column if not exists contract_premium integer;
  alter table public.dbs add column if not exists intro_count      integer;

  comment on column public.dbs.contract_premium is '계약 월납(원) — 체결된 실제 금액. 예상업적(expect_premium)과 따로 둔다';
  comment on column public.dbs.intro_count      is '이 고객에게서 소개받은 사람 수';
end
$blk$;

/* 진행 칸만 고치는 문 — 새 칸 둘을 목록에 더한다.
   여기 없는 칸은 이 문으로 못 고친다(phone·assigned_to 는 계속 막힌다).

   그리고 「내 팀원인가」를 <b>team_members(설정)</b> 로 본다.
   is_my_teammate() 는 옛 profiles.team_id 를 보므로 여기서는 안 쓴다 —
   사장님이 설정에서 지정하신 그대로 움직이게 한다. */
create or replace function public.pipeline_can_edit(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select public.is_admin()
      or p_owner = auth.uid()
      or (
        (select role from public.profiles where id = auth.uid())
          in ('leader','branch_manager','master','owner','admin')
        and exists (
          select 1
          from public.team_members me
          join public.team_members him on him.team_id = me.team_id
          where me.member_id = auth.uid()
            and him.member_id = p_owner
        )
      );
$fn$;

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
     region, memo, next_appt, expect_premium, contract_premium,
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

revoke all on function public.pipeline_can_edit(uuid)       from public;
revoke all on function public.pipeline_save(uuid, jsonb)    from public;
revoke all on function public.pipeline_new(uuid, jsonb)     from public;
grant execute on function public.pipeline_can_edit(uuid)    to authenticated;
grant execute on function public.pipeline_save(uuid, jsonb) to authenticated;
grant execute on function public.pipeline_new(uuid, jsonb)  to authenticated;


/* ════════════════════════════════════════════════════════════════
   ② 보이는 범위도 설정을 따르게 하기 — <b>기본 꺼 둠</b>

   아래를 실행하면 is_my_teammate() 가 team_members(설정) 를 봅니다.
   dbs 뿐 아니라 이 함수를 쓰는 다른 화면의 보이는 범위도 같이 바뀝니다.
   대체로 <b>좁아집니다</b> — 윤건우 팀장은 APEX 직할 11명이 아니라
   건우TEAM 4명을 보게 됩니다. 그것이 설정에 적어 두신 그대로입니다.

   되돌리려면 profiles.team_id 를 보던 옛 정의로 다시 만들면 됩니다.
   ────────────────────────────────────────────────────────────────
create or replace function public.is_my_teammate(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists(
    select 1
    from public.profiles me
    join public.team_members mine on mine.member_id = me.id
    join public.team_members his  on his.team_id   = mine.team_id
    where me.id = auth.uid()
      and me.role = 'leader'
      and coalesce(me.active, true)
      and his.member_id = target
  );
$fn$;
   ════════════════════════════════════════════════════════════════ */
