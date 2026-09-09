/* ════════════════════════════════════════════════════════════════
   배정한 DB 가 계약까지 갔는지 — 진행 칸 셋과, 팀장이 대신 적는 길

   DB 를 나눠 주고 나면 그 다음이 사람 머리에만 있었습니다. dbs 표에는
   이미 배정일·담당자·종류·지역·이름·단계·다음약속·비고가 다 있습니다.
   모자란 것은 딱 셋이었습니다.

     expect_premium — 예상 월납(원). 「이 건이 되면 얼마인가」
     family_intro   — 가족소개 진행. 미요청 / 요청함 / 소개받음 / 상담예약 / 계약연결
     closed_reason  — 끝난 건. 빈 값이면 살아 있는 건, '보류' 또는 '무산'

   단계(stage)에는 「무산」이 없습니다. 넣지 않았습니다 — DB 통합 CRM 이
   쓰는 낱말을 늘리면 두 화면이 같은 것을 다르게 부르게 됩니다. 대신
   끝난 건만 따로 표시합니다. 그래야 전환율의 분모가 맞습니다.

   ── 팀장이 팀원 것을 대신 적는 길 ─────────────────────────────────
   dbs 의 수정 권한(RLS)은 「관리자 또는 본인」입니다. 이것을 넓히면
   팀장이 팀원의 <b>전화번호·담당자</b>까지 바꿀 수 있게 됩니다. 그래서
   규칙은 그대로 두고, <b>진행 칸만 고치는 문(pipeline_save)</b>을 하나
   냅니다. 이 문으로는 전화번호도, 담당자 바꾸기도, 지우기도 안 됩니다.

   Supabase → SQL Editor 에 통째로 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다.
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

do $blk$
begin
  if to_regclass('public.dbs') is null then
    raise notice 'dbs 표가 없습니다 — 건너뜁니다';
    return;
  end if;

  alter table public.dbs add column if not exists expect_premium integer;
  alter table public.dbs add column if not exists family_intro   text;
  alter table public.dbs add column if not exists closed_reason  text;

  comment on column public.dbs.expect_premium is '예상 월납(원) — 진행관리 화면에서 적는다';
  comment on column public.dbs.family_intro   is '가족소개 진행 — 미요청/요청함/소개받음/상담예약/계약연결';
  comment on column public.dbs.closed_reason  is '끝난 건 — 빈 값이면 진행중, 보류 또는 무산';
end
$blk$;

/* ── 진행 칸만 고치는 문 ────────────────────────────────────────────
   security definer 라 RLS 를 지나갑니다. 그래서 <b>여기서 직접</b>
   누구인지 확인합니다 — 관리자이거나, 본인이거나, 내 팀원일 때만.
   손댈 수 있는 칸을 아래 목록으로 못 박아 두었습니다.                */
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
  if not (public.is_admin() or owner_id = auth.uid() or public.is_my_teammate(owner_id)) then
    raise exception '내 팀이 아닌 건은 고칠 수 없습니다';
  end if;

  update public.dbs set
    region         = case when p ? 'region'         then nullif(p->>'region','')                              else region end,
    customer_name  = case when p ? 'customer_name'  then coalesce(nullif(p->>'customer_name',''),customer_name) else customer_name end,
    source         = case when p ? 'source'         then coalesce(nullif(p->>'source',''),source)             else source end,
    assigned_date  = case when p ? 'assigned_date'  then coalesce(nullif(p->>'assigned_date','')::date,assigned_date) else assigned_date end,
    stage          = case when p ? 'stage'          then coalesce(nullif(p->>'stage',''),stage)               else stage end,
    next_appt      = case when p ? 'next_appt'      then nullif(p->>'next_appt','')::timestamptz              else next_appt end,
    expect_premium = case when p ? 'expect_premium' then nullif(p->>'expect_premium','')::integer             else expect_premium end,
    family_intro   = case when p ? 'family_intro'   then nullif(p->>'family_intro','')                        else family_intro end,
    closed_reason  = case when p ? 'closed_reason'  then nullif(p->>'closed_reason','')                       else closed_reason end,
    memo           = case when p ? 'memo'           then nullif(p->>'memo','')                                else memo end,
    contracted_at  = case when p ? 'contracted_at'  then nullif(p->>'contracted_at','')::timestamptz          else contracted_at end,
    policy_sent_at = case when p ? 'policy_sent_at' then nullif(p->>'policy_sent_at','')::timestamptz         else policy_sent_at end,
    updated_at     = now(),
    updated_by     = auth.uid()
  where id = p_id;
end
$fn$;

/* ── 팀원 이름으로 새 건 만들기 ─────────────────────────────────────
   전화번호는 안 받습니다. 개인정보가 들어가는 칸은 DB 통합 CRM 의
   제대로 된 입력창에서만 적습니다.                                   */
create or replace function public.pipeline_new(p_to uuid, p jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare new_id uuid;
begin
  if p_to is null then raise exception '담당자가 없습니다'; end if;
  if not (public.is_admin() or p_to = auth.uid() or public.is_my_teammate(p_to)) then
    raise exception '내 팀이 아닌 사람에게는 만들 수 없습니다';
  end if;

  insert into public.dbs
    (assigned_to, assigned_date, customer_name, report_name, source, stage,
     region, memo, next_appt, expect_premium, family_intro, closed_reason,
     created_by, updated_by)
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
     nullif(p->>'family_intro',''),
     nullif(p->>'closed_reason',''),
     auth.uid(), auth.uid())
  returning id into new_id;

  return new_id;
end
$fn$;

revoke all on function public.pipeline_save(uuid, jsonb) from public;
revoke all on function public.pipeline_new(uuid, jsonb)  from public;
grant execute on function public.pipeline_save(uuid, jsonb) to authenticated;
grant execute on function public.pipeline_new(uuid, jsonb)  to authenticated;

/* 달별로 모아 보는 화면이라, 배정일로 자주 훑습니다 */
create index if not exists dbs_assigned_date_idx on public.dbs (assigned_date desc);
