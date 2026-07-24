-- 출근(접속) 기록 테이블 — 팀원별 일자별 접속 기록 (#4 출근 달력)
create table if not exists public.attendance (
  member_id  uuid not null references public.profiles(id) on delete cascade,
  att_date   date not null,
  first_seen timestamptz not null default now(),
  primary key (member_id, att_date)
);
alter table public.attendance enable row level security;

drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance
  for select to authenticated using (true);

drop policy if exists attendance_insert_own on public.attendance;
create policy attendance_insert_own on public.attendance
  for insert to authenticated with check (member_id = auth.uid());

grant select, insert on public.attendance to authenticated;
