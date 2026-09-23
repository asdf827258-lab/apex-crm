/* ════════════════════════════════════════════════════════════════
   애스크나우에서 받은 답을 <b>한 번 받아 팀 전원이</b> 보는 자리

   2026-09-24 · 사장님 말씀 「회사가 매번 자료를 업데이트해 주니 그걸
   실시간으로 반영하고 싶다」.

   ★ 먼저 정직하게 — <b>실시간이 아닙니다.</b> 애스크나우는 세일즈플러스가
     넘겨주는 개인 토큰으로만 열려서, 우리 서버가 대신 들어가 물어볼 수가
     없습니다. 그래서 「로그인한 한 사람이 받아 저장하면 나머지는 로그인
     없이 본다」로 정했습니다(사장님 선택). 저장된 값은 <b>받은 그 순간의
     값</b>입니다.

   ★ 그래서 <code>asked_on</code>(받은 날)이 <b>필수</b>입니다. 이 한 칸이
     이 표의 전부입니다 — 날짜 없이 저장된 환급률은 고객 앞에서
     「언제 기준이냐」는 물음에 답을 못 합니다. 화면은 30일이 지나면
     노랑, 90일이 지나면 빨강으로 <b>다시 받으라</b>고 말합니다.

   ★ 같은 질문을 두 벌 쌓지 않습니다 (CLAUDE.md 5-1). 질문+기준을 공백
     지우고 소문자로 눌러 만든 <code>fingerprint</code> 에 유일 색인을 겁니다.
     같은 질문을 다시 저장하면 <b>새 줄이 아니라 최신 답으로 갱신</b>됩니다.

   ★ 쓰기는 <b>대표·본부장·관리자만</b>입니다(<code>is_editor_all()</code>,
     migration_53 과 같은 문지기). 아무나 답을 심으면 팀이 그 숫자의
     출처를 못 믿습니다. 읽기는 로그인한 전원입니다 — 공유가 목적입니다.

   ★ <b>약관 원문은 여기 올리지 않습니다</b>(CLAUDE.md 9번). 챗봇이 정리해
     준 답과 표만 둡니다.
   ════════════════════════════════════════════════════════════════ */

create table if not exists public.asknow_answers (
  id          uuid primary key default gen_random_uuid(),
  fingerprint text not null,
  topic       text,
  product     text,
  basis       text,
  question    text not null,
  answer      text not null,
  asked_on    date not null default current_date,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

/* 같은 질문은 한 줄 — 다시 저장하면 갱신된다 */
create unique index if not exists asknow_answers_fp
  on public.asknow_answers(fingerprint);

/* 목록은 늘 「최근에 받은 것」부터 선다 */
create index if not exists asknow_answers_asked
  on public.asknow_answers(asked_on desc);

alter table public.asknow_answers enable row level security;

/* ── 읽기 : 로그인한 전원 (이 표를 만든 이유) ───────────────────── */
drop policy if exists asknow_select on public.asknow_answers;
create policy asknow_select on public.asknow_answers
  for select
  using (auth.uid() is not null);

/* ── 쓰기 : 대표·본부장·관리자만 ───────────────────────────────── */
drop policy if exists asknow_insert on public.asknow_answers;
create policy asknow_insert on public.asknow_answers
  for insert
  with check (public.is_editor_all());

drop policy if exists asknow_update on public.asknow_answers;
create policy asknow_update on public.asknow_answers
  for update
  using      (public.is_editor_all())
  with check (public.is_editor_all());

drop policy if exists asknow_delete on public.asknow_answers;
create policy asknow_delete on public.asknow_answers
  for delete
  using (public.is_editor_all());

/* ── 넣은 뒤 확인할 것 ───────────────────────────────────────────
     ① 설계사(member) 계정으로 목록이 <b>보이는지</b>        → 보여야 함
     ② 설계사 계정으로 저장이 <b>0줄</b>로 막히는지           → 막혀야 함
        (Supabase 는 RLS 로 막힌 쓰기를 에러가 아니라 「0줄」로 돌려줍니다.
         앱은 돌려준 줄을 세어 판단합니다 — migration_53 에서 덴 자리입니다.)
     ③ 같은 질문을 두 번 저장하면 줄이 <b>하나로</b> 남는지
   ════════════════════════════════════════════════════════════════ */
