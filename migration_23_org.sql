set search_path = public;

create table if not exists public.org_members(
  id text primary key,
  name text not null default '',
  rank text default '설계사',
  team text default '',
  parent text default '',
  phone text default '',
  insta text default '',
  photo text default '',
  updated_at timestamptz default now(),
  updated_by uuid
);

alter table public.org_members add column if not exists updated_at timestamptz default now();
alter table public.org_members add column if not exists updated_by uuid;

alter table public.org_members enable row level security;

drop policy if exists org_members_read on public.org_members;
create policy org_members_read on public.org_members
  for select to authenticated using (true);

drop policy if exists org_members_write on public.org_members;
create policy org_members_write on public.org_members
  for all to authenticated
  using (public.is_admin() or public.is_owner())
  with check (public.is_admin() or public.is_owner());

grant select on public.org_members to authenticated;
grant insert, update, delete on public.org_members to authenticated;

select count(*) as org_members_rows from public.org_members;

notify pgrst, 'reload schema';
