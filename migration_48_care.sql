/* ════════════════════════════════════════════════════════════════
   계약하고 나서가 진짜 시작입니다 — 1·3·6·12개월 챙긴 기록

   계약이 되면 끝난 것처럼 되어 있었습니다. 그런데 실제로 깨지는 자리는
   계약 다음입니다.

     · 2회차 보험료가 안 빠져서 실효     (1~3개월)
     · 증권을 안 보내서 민원              (1개월)
     · 품질보증해지 기간(3개월)을 모르고 지나감
     · 병원 다녀온 걸 청구 안 하고 넘어감 (6개월)
     · 갱신형 특약 보험료가 오르는 걸 미리 안 알려 줌 (1년)

   그래서 계약일로부터 1·3·6·12개월이 되면 「오늘의 알림」에 뜹니다.
   여기 적는 것은 <b>챙겼다는 표시 하나</b>뿐입니다.

     followup — {"m1":{"at":"2026-10-05","by":"<사람 id>"}, "m3":…}

   Supabase → SQL Editor 에 통째로 붙여 넣고 한 번 실행하십시오.
   여러 번 실행해도 안전합니다. migration_41 을 먼저 돌렸어야 합니다
   (계약일 contracted_at 이 거기서 생깁니다).
   ════════════════════════════════════════════════════════════════ */
set search_path = public;

do $blk$
begin
  if to_regclass('public.dbs') is null then
    raise notice 'dbs 표가 없습니다 — 건너뜁니다';
    return;
  end if;

  alter table public.dbs add column if not exists followup jsonb not null default '{}'::jsonb;

  /* 혹시 옛 줄에 null 이 들어가 있으면 빈 것으로 맞춰 둡니다 */
  update public.dbs set followup = '{}'::jsonb where followup is null;
end
$blk$;

/* ── 지금 챙길 것이 몇 건인지 미리 본다 ───────────────────────
   계약일이 있는 사람만 셉니다. 계약일이 안 적혀 있으면 알림이 뜨지
   않으므로, 이 숫자가 0 인데 계약이 있다면 계약일부터 채워야 합니다. */
do $blk$
declare n_contract int; n_nodate int;
begin
  if to_regclass('public.dbs') is null then return; end if;

  select count(*) into n_contract
    from public.dbs
   where coalesce(stage,'') in ('계약완료','증권전달')
     and contracted_at is not null;

  select count(*) into n_nodate
    from public.dbs
   where coalesce(stage,'') in ('계약완료','증권전달')
     and contracted_at is null;

  raise notice '계약일이 있는 계약 % 건 — 여기에 1·3·6·12개월 알림이 붙습니다', n_contract;
  if n_nodate > 0 then
    raise notice '⚠ 계약일이 비어 있는 계약이 % 건 있습니다 — DB 수정 창에서 계약일을 채워야 알림이 뜹니다', n_nodate;
  end if;
end
$blk$;

/* ── 확인 ─────────────────────────────────────────────────────── */
select customer_name,
       contracted_at                                   as 계약일,
       (current_date - contracted_at)                   as 지난날,
       case
         when contracted_at is null                       then '계약일 없음'
         when current_date - contracted_at >= 365         then '1년'
         when current_date - contracted_at >= 180         then '6개월'
         when current_date - contracted_at >= 90          then '3개월'
         when current_date - contracted_at >= 30          then '1개월'
         else '아직'
       end                                              as 지금단계,
       followup                                         as 챙긴기록
  from public.dbs
 where coalesce(stage,'') in ('계약완료','증권전달')
 order by contracted_at desc nulls last
 limit 50;
