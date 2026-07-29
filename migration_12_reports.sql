-- 12: 윤시스쿨 보고서 — 팀원이 올리고 대표만 열람 (재실행 안전)
-- 성장 보고 · 회의 주제 · 자료 정리 · 현안 요청을 대표에게만 전달한다.

-- 대표(오너) 판별 함수 — app_config.owner_email 과 로그인 이메일 비교.
-- owner_email 이 없으면(초기) 관리자(admin)를 대표로 간주해 잠기지 않게 한다.
create or replace function public.is_owner()
returns boolean language plpgsql stable security definer set search_path=public as $$
declare oe text; me text;
begin
  select value into oe from public.app_config where key='owner_email' limit 1;
  select email into me from auth.users where id = auth.uid();
  if oe is null or oe = '' then
    return exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','owner') and active=true);
  end if;
  return lower(coalesce(me,'')) = lower(oe)
      or exists(select 1 from public.profiles where id=auth.uid() and role='owner' and active=true);
end $$;
grant execute on function public.is_owner() to authenticated;

create table if not exists public.reports(
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text,
  kind text not null default 'growth',   -- growth | meeting | material | issue
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists reports_created_idx on public.reports(created_at desc);
create index if not exists reports_author_idx on public.reports(author_id, created_at desc);

alter table public.reports enable row level security;

-- 작성자 본인 + 대표만 조회 (다른 팀원에게는 보이지 않음)
drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports
  for select to authenticated
  using (author_id = auth.uid() or public.is_owner());

-- 본인 이름으로만 제출
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports
  for insert to authenticated with check (author_id = auth.uid());

-- 확인 처리(read_at)는 대표만
drop policy if exists reports_update on public.reports;
create policy reports_update on public.reports
  for update to authenticated using (public.is_owner()) with check (public.is_owner());

-- 삭제는 대표 또는 작성자 본인
drop policy if exists reports_delete on public.reports;
create policy reports_delete on public.reports
  for delete to authenticated using (public.is_owner() or author_id = auth.uid());

grant select, insert, update, delete on public.reports to authenticated;
