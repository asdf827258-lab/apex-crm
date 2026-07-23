-- APEX DB CRM / 파이프라인·접촉·소개 마이그레이션 (3단계)
-- 기존 프로젝트에 안전하게 추가됩니다. 여러 번 실행해도 됩니다(멱등).
-- Supabase Dashboard > SQL Editor에서 전체 실행하세요.

-- ============================================================
-- 1) dbs: DB 구분(소개/지인) + 진행 단계(TA/AP/PC/CS)
-- ============================================================
alter table public.dbs add column if not exists source   text not null default '일반';
alter table public.dbs add column if not exists referrer text;                 -- 소개자/지인 관계
alter table public.dbs add column if not exists stage    text not null default '미접촉';

alter table public.dbs drop constraint if exists dbs_source_check;
alter table public.dbs add  constraint dbs_source_check check (source in ('소개','지인','개척','일반'));
alter table public.dbs drop constraint if exists dbs_stage_check;
alter table public.dbs add  constraint dbs_stage_check  check (stage  in ('미접촉','TA','AP','PC','CS'));

create index if not exists dbs_stage_idx on public.dbs(stage);

-- ============================================================
-- 2) calls: 이번 접촉의 단계 스냅샷(선택)
-- ============================================================
alter table public.calls add column if not exists stage text;
alter table public.calls drop constraint if exists calls_stage_check;
alter table public.calls add  constraint calls_stage_check check (stage is null or stage in ('TA','AP','PC','CS'));

-- ============================================================
-- 3) RLS: 담당자(회원)도 '본인 배정 DB' 등록·수정 가능
--    (삭제·타인 재배정은 여전히 관리자만)
-- ============================================================
-- 등록: 관리자 전체 / 담당자는 본인에게 배정한 DB만
drop policy if exists "dbs_admin_insert" on public.dbs;
drop policy if exists "dbs_insert" on public.dbs;
create policy "dbs_insert" on public.dbs for insert to authenticated
with check (public.is_admin() or assigned_to = auth.uid());

-- 수정: 관리자 전체 / 담당자는 본인 배정 DB만(다른 사람에게 넘길 수 없음)
drop policy if exists "dbs_admin_update" on public.dbs;
drop policy if exists "dbs_update" on public.dbs;
create policy "dbs_update" on public.dbs for update to authenticated
using  (public.is_admin() or assigned_to = auth.uid())
with check (public.is_admin() or assigned_to = auth.uid());

-- 삭제: 관리자만 (기존 유지)
drop policy if exists "dbs_admin_delete" on public.dbs;
create policy "dbs_admin_delete" on public.dbs for delete to authenticated
using (public.is_admin());

-- 참고: dbs_select(관리자/본인/팀장 팀원)와 calls 정책은 그대로입니다.
--  - 담당자는 본인 배정 DB를 등록·수정하고 TA(접촉)를 기록할 수 있습니다.
--  - 재배정(타인에게 넘기기)·삭제는 관리자 전용입니다.
