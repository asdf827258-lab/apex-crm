-- 출근(접속) 기록 테이블 — 팀원별 일자별 접속 기록 (#4 출근 달력)
create table if not exists public.attendance (
  member_id  uuid not null references public.profiles(id) on delete cascade,
  att_date   date not null,
  first_seen timestamptz not null default now(),
  primary key (member_id, att_date)
);
-- 최근 접속시각(재실행 안전) — 있으면 건너뜀
alter table public.attendance add column if not exists last_seen timestamptz;
alter table public.attendance enable row level security;

drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance
  for select to authenticated using (true);

drop policy if exists attendance_insert_own on public.attendance;
create policy attendance_insert_own on public.attendance
  for insert to authenticated with check (member_id = auth.uid());

-- 본인 행의 최근 접속시각 갱신 허용(로그인 시각/최근 접속 표시용)
drop policy if exists attendance_update_own on public.attendance;
create policy attendance_update_own on public.attendance
  for update to authenticated using (member_id = auth.uid()) with check (member_id = auth.uid());

grant select, insert, update on public.attendance to authenticated;
