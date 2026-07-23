-- APEX DB CRM / DB 카테고리(구분) 관리 + 타율 분석 (4단계)
-- 기존 프로젝트에 안전하게 추가됩니다. 여러 번 실행해도 됩니다(멱등).
-- Supabase Dashboard > SQL Editor에서 전체 실행하세요.

-- ============================================================
-- 1) db_categories: 사용자가 직접 추가하는 DB 구분(카테고리)
-- ============================================================
create table if not exists public.db_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort int  not null default 100,
  created_at timestamptz not null default now()
);

-- 기본 구분 시드(소개/지인/개척/일반)
insert into public.db_categories(name, sort) values
  ('소개',10),('지인',20),('개척',30),('일반',40)
on conflict (name) do nothing;

-- ============================================================
-- 2) dbs.source 제약 해제 → 사용자 정의 카테고리 저장 허용
--    (기존 4종 외에 관리자가 새 구분을 추가해도 저장됩니다)
-- ============================================================
alter table public.dbs drop constraint if exists dbs_source_check;

-- ============================================================
-- 3) RLS: 조회는 로그인 사용자 전체, 추가/수정/삭제는 관리자만
-- ============================================================
alter table public.db_categories enable row level security;

drop policy if exists db_categories_select on public.db_categories;
create policy db_categories_select on public.db_categories for select to authenticated using (true);

drop policy if exists db_categories_admin_write on public.db_categories;
create policy db_categories_admin_write on public.db_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

notify pgrst, 'reload schema';
