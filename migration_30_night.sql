set search_path = public;

create table if not exists public.night_jobs(
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  ref_id text not null,
  ref_date date not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'todo',
  tries integer not null default 0,
  last_error text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.night_jobs add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.night_jobs add column if not exists tries integer not null default 0;
alter table public.night_jobs add column if not exists last_error text default '';
alter table public.night_jobs add column if not exists updated_at timestamptz default now();

create unique index if not exists night_jobs_uniq on public.night_jobs(kind, ref_date, ref_id);
create index if not exists night_jobs_pick on public.night_jobs(status, ref_date);

alter table public.night_jobs enable row level security;

drop policy if exists night_jobs_read on public.night_jobs;
create policy night_jobs_read on public.night_jobs
  for select to authenticated
  using (public.is_team_viewer());

grant select on public.night_jobs to authenticated;

create table if not exists public.night_briefs(
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  ref_id text not null,
  ref_date date not null,
  member_id uuid,
  title text not null default '',
  body text not null default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.night_briefs add column if not exists member_id uuid;
alter table public.night_briefs add column if not exists meta jsonb not null default '{}'::jsonb;

create unique index if not exists night_briefs_uniq on public.night_briefs(kind, ref_date, ref_id);
create index if not exists night_briefs_member_idx on public.night_briefs(member_id, ref_date desc);
create index if not exists night_briefs_date_idx on public.night_briefs(ref_date desc);

alter table public.night_briefs enable row level security;

drop policy if exists night_briefs_read on public.night_briefs;
create policy night_briefs_read on public.night_briefs
  for select to authenticated
  using (member_id is null or member_id = auth.uid() or public.is_team_viewer());

drop policy if exists night_briefs_delete on public.night_briefs;
create policy night_briefs_delete on public.night_briefs
  for delete to authenticated
  using (public.is_admin() or public.is_owner());

grant select on public.night_briefs to authenticated;
grant delete on public.night_briefs to authenticated;

insert into public.app_config(key, value)
values ('schema_version', '30')
on conflict (key) do update set value = excluded.value, updated_at = now();

notify pgrst, 'reload schema';

select
  to_regclass('public.night_jobs')   is not null as 밤작업_큐,
  to_regclass('public.night_briefs') is not null as 밤작업_결과,
  (select count(*) from public.night_jobs   where status = 'todo') as 남은_일,
  (select count(*) from public.night_briefs where ref_date >= current_date - 1) as 최근_결과;
