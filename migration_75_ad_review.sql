/* ════════════════════════════════════════════════════════════════════════
   광고 저녁 자가 점검 — 판단을 적어 두는 자리 (판 X427)

   사장님 말씀 2026-11-12:
     「매일 저녁 스스로 광고 내용에대해 피드백 하고, 성장하는 광고 시스템」

   ★ 왜 표를 하나 더 두는가 — <b>적어 두지 않으면 성장이 없습니다.</b>
     매일 저녁 같은 숫자를 보고 같은 소리만 하는 기계는 자라지 않습니다.
     그날의 판단을 남겨 두면, 다음 저녁에 <b>지난 판단을 먼저 읽고</b>
     「지킨 것 · 안 지킨 것 · 내가 틀린 것」 을 적을 수 있습니다.
     그것이 이 표의 유일한 존재 이유입니다.

   ⚠️ 왜 이런 사실이 필요했나 — 2026-11-12 에 재어 보니
      · 광고비가 2026-10-08 에서 멈춰 있었습니다 (클라우드가 쓴 줄 0 · 35일)
      · 카톡 클릭이 2026-10-23 이 마지막이었습니다 (20일)
      · 3주 내내 하루 방문이 한 자릿수~20명 — 광고가 사실상 꺼져 있었습니다
      아무도 <b>매일 말해 주지 않아서</b> 한 달을 모르고 지났습니다.
      그래서 이 자는 숫자를 보기 <b>전에</b> 「내가 지금 눈이 멀었나」 를
      먼저 적습니다. 모르는 숫자로 효율을 따지면 그게 더 위험합니다 (1번).

   ★ 문구 초안은 <b>심의 전</b>입니다 (사장님 결정 2026-11-12).
     copy_draft 에 든 글은 어디에도 그냥 나가지 않습니다 — 화면에 접힌 칸으로
     「심의 전 초안」 딱지를 달고 서고, 쓰실지는 사람이 정합니다 (2번).

   돌리는 법: Supabase → SQL Editor 에 붙여 한 번 실행.
             여러 번 실행해도 같습니다 (if not exists).
   ════════════════════════════════════════════════════════════════════════ */

create table if not exists public.ad_notes (
  d            date        primary key,
  made_at      timestamptz not null default now(),

  /* 못 본 것 — 하나라도 차 있으면 효율 이야기를 안 합니다 */
  blind        text[],

  /* 그날 광고가 어떤 상태였나: '멈춤' · '적음' · '돌아감' · '모름' */
  state        text,

  /* 그날 본 숫자를 그대로. 나중에 「그때 숫자가 뭐였지」 를 되짚을 유일한 길 */
  facts        jsonb,

  /* 사람이 읽을 판단 */
  verdict      text,

  /* 사장님께 부탁한 것 — 다음 저녁에 「지켜졌나」 를 이걸로 봅니다 */
  asks         text[],

  /* ★ 어제 판단을 돌아본 글. 이 칸이 비어 있으면 그냥 보고서일 뿐입니다 */
  looked_back  text,

  /* 심의 전 문구 초안. 비어 있을 수 있습니다 — 지어 넣지 않습니다 (1번) */
  copy_draft   jsonb,

  /* 어느 모델이 썼나. null 이면 AI 를 안 썼다는 뜻입니다 — 비워 두는 것이
     「AI 가 썼다」 로 읽히면 안 됩니다 (1번) */
  model        text,

  note         text
);

comment on table public.ad_notes is
  '광고 저녁 자가 점검의 판단 기록. 하루 한 줄. 다음 저녁이 이걸 읽고 지난 판단을 돌아봅니다 (판 X427).';
comment on column public.ad_notes.blind is
  '그날 못 본 것. 차 있으면 효율 판단을 하지 않습니다 — 모르는 숫자로 단정하지 않기 (CLAUDE.md 1번).';
comment on column public.ad_notes.looked_back is
  '어제 판단을 돌아본 글. 지킨 것·안 지킨 것·내가 틀린 것. 이 칸이 성장의 전부입니다.';
comment on column public.ad_notes.copy_draft is
  '심의 전 문구 초안. 그냥 내보내지 않습니다 — 화면에 「심의 전」 딱지를 달고 섭니다 (CLAUDE.md 2번).';
comment on column public.ad_notes.model is
  '판단을 쓴 모델 이름. null 은 AI 를 안 썼다는 뜻 — 비었다고 AI 가 썼다고 읽으면 안 됩니다.';

alter table public.ad_notes enable row level security;

/* 로그인한 설계사는 읽고, 쓰는 것은 저녁 함수(service_role)만 합니다 —
   화면에서 판단을 고쳐 쓸 수 있으면 기록이 기록이 아닙니다 */
do $$
begin
  if not exists (select 1 from pg_policies
                  where schemaname='public' and tablename='ad_notes'
                    and policyname='ad_notes_auth_read') then
    create policy ad_notes_auth_read on public.ad_notes
      for select to authenticated using (true);
  end if;
end $$;

grant select on public.ad_notes to authenticated;
grant select, insert, update on public.ad_notes to service_role;

/* 화면이 어젯밤·그제밤 두 줄만 읽습니다. 뷰를 따로 두지 않습니다 —
   order by d desc limit 2 로 충분하고, 뷰를 두면 세는 곳이 둘이 됩니다 (5번) */
