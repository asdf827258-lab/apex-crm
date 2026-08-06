set search_path = public;

create table if not exists public.coach_logs(
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null,
  coach_id uuid not null,
  coach_date date not null default current_date,
  strength text default '',
  weak text default '',
  todo text default '',
  recheck_date date,
  note text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.coach_logs add column if not exists strength text default '';
alter table public.coach_logs add column if not exists weak text default '';
alter table public.coach_logs add column if not exists todo text default '';
alter table public.coach_logs add column if not exists recheck_date date;
alter table public.coach_logs add column if not exists note text default '';
alter table public.coach_logs add column if not exists updated_at timestamptz default now();

create index if not exists coach_logs_member_idx on public.coach_logs(member_id);
create index if not exists coach_logs_date_idx on public.coach_logs(coach_date desc);
create index if not exists coach_logs_recheck_idx on public.coach_logs(recheck_date);

alter table public.coach_logs enable row level security;

drop policy if exists coach_logs_read on public.coach_logs;
create policy coach_logs_read on public.coach_logs
  for select to authenticated
  using (
    member_id = auth.uid()
    or coach_id = auth.uid()
    or public.is_leader()
    or public.is_admin()
    or public.is_owner()
  );

drop policy if exists coach_logs_insert on public.coach_logs;
create policy coach_logs_insert on public.coach_logs
  for insert to authenticated
  with check (coach_id = auth.uid());

drop policy if exists coach_logs_update on public.coach_logs;
create policy coach_logs_update on public.coach_logs
  for update to authenticated
  using (coach_id = auth.uid() or public.is_admin() or public.is_owner())
  with check (coach_id = auth.uid() or public.is_admin() or public.is_owner());

drop policy if exists coach_logs_delete on public.coach_logs;
create policy coach_logs_delete on public.coach_logs
  for delete to authenticated
  using (coach_id = auth.uid() or public.is_admin() or public.is_owner());

grant select on public.coach_logs to authenticated;
grant insert, update, delete on public.coach_logs to authenticated;

notify pgrst, 'reload schema';

select
  to_regclass('public.coach_logs') is not null as 코칭기록표,
  (select count(*) from public.coach_logs)     as 기록수,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'coach_logs') as 정책수;
