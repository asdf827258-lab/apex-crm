-- APEX / 법인·사업자 컨설팅 모듈 서버 저장 (business_clients)
-- Supabase Dashboard > SQL Editor에서 전체 실행하세요. 여러 번 실행해도 안전합니다(멱등).
--
-- 설계 메모:
--   컨설팅 워크시트(사업자 프로필 + 직원 명부 + AI 상담자료)를 담당자별 1행/사업자로
--   JSONB(data)에 보관한다. 정규화 대신 문서형을 택한 이유:
--     - 프런트가 단일 파일(app/index.html) 로컬우선 구조라 부분동기화 버그 위험을 없애고,
--     - 담당자별 작업 문서 성격이라 조인/집계 요구가 낮다.
--   행 단위 접근제어는 담당자(advisor_id) 소유 + 관리자(is_admin())로 RLS 처리한다.
--   (is_admin() 함수는 supabase_schema.sql에서 이미 생성됨)

create extension if not exists pgcrypto;

-- ============================================================
-- 1) 테이블
-- ============================================================
create table if not exists public.business_clients (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  name text not null default '새 사업자',
  data jsonb not null default '{}'::jsonb,     -- { profile:{...}, staff:[...], ai:{...} }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_clients_advisor_idx on public.business_clients(advisor_id);
create index if not exists business_clients_updated_idx on public.business_clients(updated_at desc);

-- ============================================================
-- 2) 트리거: 생성/수정 시 담당자·시간 자동 기록
-- ============================================================
create or replace function public.biz_set_created_meta()
returns trigger
language plpgsql
as $$
begin
  if new.advisor_id is null then new.advisor_id := auth.uid(); end if;
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.biz_set_updated_meta()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.advisor_id := old.advisor_id;   -- 소유자는 변경 불가
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists business_clients_created_meta on public.business_clients;
create trigger business_clients_created_meta before insert on public.business_clients
for each row execute procedure public.biz_set_created_meta();

drop trigger if exists business_clients_updated_meta on public.business_clients;
create trigger business_clients_updated_meta before update on public.business_clients
for each row execute procedure public.biz_set_updated_meta();

-- ============================================================
-- 3) RLS — 담당자는 본인 사업자만, 관리자는 전체
-- ============================================================
alter table public.business_clients enable row level security;

drop policy if exists "business_clients_select" on public.business_clients;
create policy "business_clients_select"
on public.business_clients for select
to authenticated
using (advisor_id = auth.uid() or public.is_admin());

drop policy if exists "business_clients_insert" on public.business_clients;
create policy "business_clients_insert"
on public.business_clients for insert
to authenticated
with check (advisor_id = auth.uid() or public.is_admin());

drop policy if exists "business_clients_update" on public.business_clients;
create policy "business_clients_update"
on public.business_clients for update
to authenticated
using (advisor_id = auth.uid() or public.is_admin())
with check (advisor_id = auth.uid() or public.is_admin());

drop policy if exists "business_clients_delete" on public.business_clients;
create policy "business_clients_delete"
on public.business_clients for delete
to authenticated
using (advisor_id = auth.uid() or public.is_admin());

-- 완료. 이후 앱 상단 "관리 중 사업자" 바에서 ☁ 저장 / ⬇ 불러오기 버튼이 활성화됩니다.
-- (로그인 + config.js의 anon 키/URL 설정이 되어 있어야 합니다.)
