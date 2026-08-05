set search_path = public;

create table if not exists public.daily_checks(
  member_id uuid not null,
  check_date date not null,
  scope text not null default 'day',
  items jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  primary key (member_id, check_date, scope)
);

alter table public.daily_checks add column if not exists items jsonb not null default '{}'::jsonb;
alter table public.daily_checks add column if not exists updated_at timestamptz default now();

create index if not exists daily_checks_date_idx on public.daily_checks(check_date desc);
create index if not exists daily_checks_member_idx on public.daily_checks(member_id);

alter table public.daily_checks enable row level security;

drop policy if exists daily_checks_read on public.daily_checks;
create policy daily_checks_read on public.daily_checks
  for select to authenticated
  using (
    member_id = auth.uid()
    or public.is_leader()
    or public.is_admin()
    or public.is_owner()
  );

drop policy if exists daily_checks_insert on public.daily_checks;
create policy daily_checks_insert on public.daily_checks
  for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists daily_checks_update on public.daily_checks;
create policy daily_checks_update on public.daily_checks
  for update to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

drop policy if exists daily_checks_delete on public.daily_checks;
create policy daily_checks_delete on public.daily_checks
  for delete to authenticated
  using (member_id = auth.uid() or public.is_admin() or public.is_owner());

grant select on public.daily_checks to authenticated;
grant insert, update, delete on public.daily_checks to authenticated;

select count(*) as daily_checks_rows from public.daily_checks;

notify pgrst, 'reload schema';
