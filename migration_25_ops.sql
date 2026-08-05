set search_path = public;

create table if not exists public.health_checks(
  member_id uuid not null,
  check_date date not null,
  checked_at timestamptz default now(),
  ok_count integer default 0,
  warn_count integer default 0,
  bad_count integer default 0,
  detail jsonb not null default '[]'::jsonb,
  primary key (member_id, check_date)
);

alter table public.health_checks add column if not exists checked_at timestamptz default now();
alter table public.health_checks add column if not exists detail jsonb not null default '[]'::jsonb;

create index if not exists health_checks_date_idx on public.health_checks(check_date desc);

alter table public.health_checks enable row level security;

drop policy if exists health_checks_read on public.health_checks;
create policy health_checks_read on public.health_checks
  for select to authenticated
  using (member_id = auth.uid() or public.is_leader() or public.is_admin() or public.is_owner());

drop policy if exists health_checks_insert on public.health_checks;
create policy health_checks_insert on public.health_checks
  for insert to authenticated with check (member_id = auth.uid());

drop policy if exists health_checks_update on public.health_checks;
create policy health_checks_update on public.health_checks
  for update to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

drop policy if exists health_checks_delete on public.health_checks;
create policy health_checks_delete on public.health_checks
  for delete to authenticated
  using (member_id = auth.uid() or public.is_admin() or public.is_owner());

grant select on public.health_checks to authenticated;
grant insert, update, delete on public.health_checks to authenticated;

create table if not exists public.suggestions(
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null,
  author_name text default '',
  kind text not null default 'idea',
  title text not null default '',
  body text not null default '',
  context jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  reply text default '',
  replied_by uuid,
  replied_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.suggestions add column if not exists author_name text default '';
alter table public.suggestions add column if not exists context jsonb not null default '{}'::jsonb;
alter table public.suggestions add column if not exists reply text default '';
alter table public.suggestions add column if not exists replied_by uuid;
alter table public.suggestions add column if not exists replied_at timestamptz;
alter table public.suggestions add column if not exists updated_at timestamptz default now();

create index if not exists suggestions_created_idx on public.suggestions(created_at desc);
create index if not exists suggestions_member_idx on public.suggestions(member_id);
create index if not exists suggestions_status_idx on public.suggestions(status);

alter table public.suggestions enable row level security;

drop policy if exists suggestions_read on public.suggestions;
create policy suggestions_read on public.suggestions
  for select to authenticated
  using (member_id = auth.uid() or public.is_leader() or public.is_admin() or public.is_owner());

drop policy if exists suggestions_insert on public.suggestions;
create policy suggestions_insert on public.suggestions
  for insert to authenticated with check (member_id = auth.uid());

drop policy if exists suggestions_update_own on public.suggestions;
create policy suggestions_update_own on public.suggestions
  for update to authenticated
  using (member_id = auth.uid() and status = 'new')
  with check (member_id = auth.uid());

drop policy if exists suggestions_update_admin on public.suggestions;
create policy suggestions_update_admin on public.suggestions
  for update to authenticated
  using (public.is_admin() or public.is_owner())
  with check (public.is_admin() or public.is_owner());

drop policy if exists suggestions_delete on public.suggestions;
create policy suggestions_delete on public.suggestions
  for delete to authenticated
  using ((member_id = auth.uid() and status = 'new') or public.is_admin() or public.is_owner());

grant select on public.suggestions to authenticated;
grant insert, update, delete on public.suggestions to authenticated;

notify pgrst, 'reload schema';

select
  to_regclass('public.health_checks') is not null as 점검기록표,
  to_regclass('public.suggestions')   is not null as 건의함표;
