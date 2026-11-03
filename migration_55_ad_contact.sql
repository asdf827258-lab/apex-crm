-- migration_55 — 문의에 「연락처」와 「다음에 할 일」을 적을 자리를 만든다. (2026-11-03)
--
-- 왜
--   인스타 DM 은 상대가 대화를 지우면 그걸로 끝이고, 카톡도 나가면 닿을 길이 없다.
--   전화번호가 있어야 다시 연락하고 관리할 수 있다.
--
-- ⚠ 랜딩페이지가 번호를 받는 것은 **심의 조건으로 영구 금지**다.
--   여기 들어오는 번호는 오직 **대화 중에 고객이 직접 준 것**이다.
-- ⚠ consent_at 이 비어 있으면 연락해서는 안 된다. 화면도 그런 건 전화 버튼을 숨긴다.
-- ⚠ clients 테이블의 동의 모델(consent_status)을 **우회하지 않는다.**
--   정식 고객 등록은 CRM 본 화면에서 동의를 받고 한다. 여기는 「아직 고객이 아닌 문의」 자리다.
--
-- 권한: ad_inquiries 는 authenticated 전용이다(anon 정책 없음). 새 칸도 같은 보호를 받는다.
-- 이미 2026-11-03 에 적용됨 (supabase migration: ad_inquiries_contact_and_followup).

alter table public.ad_inquiries
  add column if not exists phone      text,
  add column if not exists consent_at timestamptz,
  add column if not exists next_at    date,
  add column if not exists next_todo  text;

comment on column public.ad_inquiries.phone      is '고객이 대화 중에 직접 준 번호. 랜딩 폼 수집 금지(심의 조건).';
comment on column public.ad_inquiries.consent_at is '연락해도 된다고 한 시각. 비어 있으면 연락 금지.';
comment on column public.ad_inquiries.next_at    is '다시 연락하기로 한 날';
comment on column public.ad_inquiries.next_todo  is '그날 할 일 한 줄';

create index if not exists ad_inquiries_next_at_idx
  on public.ad_inquiries (next_at)
  where next_at is not null;
