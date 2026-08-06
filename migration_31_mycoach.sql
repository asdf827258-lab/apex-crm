set search_path = public;

create table if not exists public.coach_notes(
  id uuid primary key default gen_random_uuid(),
  log_id uuid,
  member_id uuid not null,
  body text not null default '',
  mood text default '',
  share boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.coach_notes add column if not exists log_id uuid;
alter table public.coach_notes add column if not exists mood text default '';
alter table public.coach_notes add column if not exists share boolean not null default false;
alter table public.coach_notes add column if not exists updated_at timestamptz default now();

create index if not exists coach_notes_member_idx on public.coach_notes(member_id, created_at desc);
create index if not exists coach_notes_log_idx on public.coach_notes(log_id);
create index if not exists coach_notes_share_idx on public.coach_notes(share, created_at desc);

alter table public.coach_notes enable row level security;

drop policy if exists coach_notes_read on public.coach_notes;
create policy coach_notes_read on public.coach_notes
  for select to authenticated
  using (
    member_id = auth.uid()
    or (share = true and public.is_team_viewer())
  );

drop policy if exists coach_notes_insert on public.coach_notes;
create policy coach_notes_insert on public.coach_notes
  for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists coach_notes_update on public.coach_notes;
create policy coach_notes_update on public.coach_notes
  for update to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

drop policy if exists coach_notes_delete on public.coach_notes;
create policy coach_notes_delete on public.coach_notes
  for delete to authenticated
  using (member_id = auth.uid() or public.is_admin() or public.is_owner());

grant select on public.coach_notes to authenticated;
grant insert, update, delete on public.coach_notes to authenticated;

insert into public.app_config(key, value)
values ('schema_version', '31')
on conflict (key) do update set value = excluded.value, updated_at = now();

notify pgrst, 'reload schema';

select
  to_regclass('public.coach_notes') is not null as 내코칭_메모표,
  (select count(*) from public.coach_notes)                 as 전체_메모,
  (select count(*) from public.coach_notes where share)     as 지점장에게_보인_것,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'coach_notes') as 정책수;
