/* ══ migration_55 — 배정 DB 단계에 「부재 · 거절 · 소개완료」 를 보탭니다 (판 X394) ══════
   사장님 말씀 (2026-11-10) 「오늘에서 안되는 것들 찾아서 다시 하고 다시 확인해줄래」.

   ⚠ 재어 보니 앱의 단계 표(apex-stage.js · ORDER)는 열 가지인데
     (미접촉 · 부재 · 거절 · TA · AP · PC · CS · 계약완료 · 증권전달 · 소개완료)
     서버 규칙(dbs_stage_chk · migration_41)은 일곱 가지만 받았습니다.
     그래서 홈 「💬 소개 받음」(→ 소개완료) · 「🕗 ✖ 거절로 정리」(→ 거절) ·
     CRM 에서 그 단계를 고를 때 서버가 통째로 거절했습니다.
     2026-11-09 오후에만 실제로 9번 막혔습니다(postgres 로그 · dbs_stage_chk).
   ★ 규칙을 <b>넓히기만</b> 합니다 — 기존 줄은 한 줄도 안 바뀝니다.
   ★ 되돌리려면 같은 꼴로 일곱 가지만 다시 적으면 됩니다(그 셋을 쓴 줄이 없을 때).
   ★ 여러 번 돌려도 같습니다(있으면 지우고 다시 겁니다). */
alter table public.dbs drop constraint if exists dbs_stage_chk;
alter table public.dbs add constraint dbs_stage_chk
  check (stage is null or stage in
    ('미접촉','부재','거절','TA','AP','PC','CS','계약완료','증권전달','소개완료'));
