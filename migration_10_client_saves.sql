-- 10: 고객 365일 — 상담자료 저장 + 고객 연락처 (재실행 안전 · 기존 데이터 손상 없음)
-- 각 설계사(로그인 계정)가 자기 고객에게 AI 보장분석 · 비포&애프터 · 재무설계 스냅샷을 저장한다.

-- 1) 고객 연락처 컬럼 추가 (있으면 건너뜀)
alter table public.clients add column if not exists phone text;

-- 2) 저장 자료 테이블 — advisor_id = 로그인한 설계사 본인
create table if not exists public.saved_reports(
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  kind text not null,              -- 'bojang' | 'baba' | 'finance' | 'consult' 등 도구 탭 id
  title text,
  content jsonb,                   -- {md: "리포트 원문"} 또는 {inputs: {재무설계 입력값}}
  created_at timestamptz not null default now()
);
create index if not exists saved_reports_client_idx on public.saved_reports(client_id);
create index if not exists saved_reports_advisor_idx on public.saved_reports(advisor_id);

alter table public.saved_reports enable row level security;

-- 본인 자료만 읽고 쓰기 (관리자는 전체 조회)
drop policy if exists saved_reports_select on public.saved_reports;
create policy saved_reports_select on public.saved_reports
  for select to authenticated using (advisor_id = auth.uid() or public.is_admin());

drop policy if exists saved_reports_insert on public.saved_reports;
create policy saved_reports_insert on public.saved_reports
  for insert to authenticated with check (advisor_id = auth.uid());

drop policy if exists saved_reports_update on public.saved_reports;
create policy saved_reports_update on public.saved_reports
  for update to authenticated using (advisor_id = auth.uid()) with check (advisor_id = auth.uid());

drop policy if exists saved_reports_delete on public.saved_reports;
create policy saved_reports_delete on public.saved_reports
  for delete to authenticated using (advisor_id = auth.uid());

grant select, insert, update, delete on public.saved_reports to authenticated;
