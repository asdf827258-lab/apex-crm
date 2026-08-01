set search_path = public;

alter table public.profiles add column if not exists status text;
alter table public.profiles add column if not exists plan text;
alter table public.profiles add column if not exists plan_until timestamptz;
alter table public.profiles add column if not exists active boolean default true;
update public.profiles set status = 'approved' where status is null;
update public.profiles set active = true where active is null;

do $rep$
declare has_key boolean; has_tbl boolean;
begin
  select exists(select 1 from information_schema.tables
                 where table_schema='public' and table_name='app_config') into has_tbl;
  if has_tbl then
    select exists(select 1 from information_schema.columns
                   where table_schema='public' and table_name='app_config' and column_name='key') into has_key;
    if not has_key then
      execute 'alter table public.app_config rename to app_config_old_backup';
      has_tbl := false;
      raise notice 'app_config had a different shape; renamed to app_config_old_backup';
    end if;
  end if;
  if not has_tbl then
    create table public.app_config(
      key text primary key,
      value text,
      updated_at timestamptz default now()
    );
    alter table public.app_config enable row level security;
  end if;
end
$rep$;

drop policy if exists app_config_select on public.app_config;
drop policy if exists app_config_write on public.app_config;
create policy app_config_select on public.app_config for select to authenticated using (true);
grant select, insert, update, delete on public.app_config to authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $fn$
  select exists(
    select 1 from public.profiles
     where id = auth.uid() and role in ('admin','owner')
  );
$fn$;
grant execute on function public.is_admin() to authenticated;

create or replace function public.is_app_admin()
returns boolean language sql stable security definer set search_path=public as $fn$
  select public.is_admin();
$fn$;
grant execute on function public.is_app_admin() to authenticated;

create or replace function public.is_owner()
returns boolean language plpgsql stable security definer set search_path=public as $fn$
declare oe text; me text; has_key boolean;
begin
  select exists(select 1 from information_schema.columns
                 where table_schema='public' and table_name='app_config' and column_name='key')
    into has_key;
  if has_key then
    begin
      execute 'select value from public.app_config where key = ''owner_email'' limit 1' into oe;
    exception when others then
      oe := null;
    end;
  end if;
  select email into me from auth.users where id = auth.uid();
  if oe is null or oe = '' then
    return exists(select 1 from public.profiles
                   where id = auth.uid() and role in ('admin','owner'));
  end if;
  return me is not null and lower(me) = lower(oe);
end;
$fn$;
grant execute on function public.is_owner() to authenticated;

create or replace function public.is_leader()
returns boolean language sql stable security definer set search_path=public as $fn$
  select exists(
    select 1 from public.profiles
     where id = auth.uid() and coalesce(active,true) = true
       and role in ('admin','owner','lead','manager','leader','master')
  ) or public.is_owner();
$fn$;
grant execute on function public.is_leader() to authenticated;

create policy app_config_write on public.app_config for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table if not exists public.teams(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text default '#1A56DB',
  leader_id uuid references public.profiles(id) on delete set null,
  goal_note text,
  created_at timestamptz not null default now()
);
create table if not exists public.team_members(
  team_id uuid not null references public.teams(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, member_id)
);
create index if not exists team_members_member_idx on public.team_members(member_id);
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

drop policy if exists teams_select on public.teams;
drop policy if exists teams_write on public.teams;
create policy teams_select on public.teams for select to authenticated using (true);
create policy teams_insert on public.teams for insert to authenticated with check (public.is_admin());
create policy teams_update on public.teams for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy teams_delete on public.teams for delete to authenticated using (public.is_admin());

drop policy if exists team_members_select on public.team_members;
drop policy if exists team_members_write on public.team_members;
create policy team_members_select on public.team_members for select to authenticated using (true);
create policy team_members_insert on public.team_members for insert to authenticated with check (public.is_admin());
create policy team_members_delete on public.team_members for delete to authenticated using (public.is_admin());

grant select, insert, update, delete on public.teams, public.team_members to authenticated;

create table if not exists public.ai_dept_reports(
  id uuid primary key default gen_random_uuid(),
  dept text not null,
  dept_name text,
  period text not null default 'daily',
  ref_date date not null default current_date,
  title text not null,
  body text,
  metrics jsonb default '{}'::jsonb,
  team_id uuid references public.teams(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists ai_dept_reports_uniq
  on public.ai_dept_reports(dept, period, ref_date, coalesce(team_id,'00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists ai_dept_reports_date_idx on public.ai_dept_reports(ref_date desc, period);
alter table public.ai_dept_reports enable row level security;
drop policy if exists ai_dept_reports_select on public.ai_dept_reports;
drop policy if exists ai_dept_reports_write on public.ai_dept_reports;
create policy ai_dept_reports_select on public.ai_dept_reports for select to authenticated using (public.is_leader());
create policy ai_dept_reports_write  on public.ai_dept_reports for all    to authenticated using (public.is_leader()) with check (public.is_leader());
grant select, insert, update, delete on public.ai_dept_reports to authenticated;

create table if not exists public.ai_ideas(
  id uuid primary key default gen_random_uuid(),
  dept text not null,
  dept_name text,
  title text not null,
  body text,
  expected_effect text,
  status text not null default 'pending',
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ai_ideas_status_idx on public.ai_ideas(status, created_at desc);
alter table public.ai_ideas enable row level security;
drop policy if exists ai_ideas_select on public.ai_ideas;
drop policy if exists ai_ideas_write on public.ai_ideas;
create policy ai_ideas_select on public.ai_ideas for select to authenticated using (public.is_leader());
create policy ai_ideas_write  on public.ai_ideas for all    to authenticated using (public.is_leader()) with check (public.is_leader());
grant select, insert, update, delete on public.ai_ideas to authenticated;

create table if not exists public.backups(
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'daily',
  label text,
  ref_date date not null default current_date,
  rows_count int default 0,
  size_bytes int default 0,
  payload jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists backups_daily_uniq on public.backups(ref_date) where kind = 'daily';
create index if not exists backups_created_idx on public.backups(created_at desc);
alter table public.backups enable row level security;
drop policy if exists backups_select on public.backups;
drop policy if exists backups_insert on public.backups;
drop policy if exists backups_delete on public.backups;
create policy backups_select on public.backups for select to authenticated using (public.is_admin());
create policy backups_insert on public.backups for insert to authenticated with check (public.is_leader());
create policy backups_delete on public.backups for delete to authenticated using (public.is_admin());
grant select, insert, delete on public.backups to authenticated;

do $rep2$
begin
  if exists(select 1 from information_schema.tables
             where table_schema='public' and table_name='clients') then
    alter table public.clients add column if not exists phone text;
  end if;
end
$rep2$;

create table if not exists public.saved_reports(
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  kind text not null,
  title text,
  content jsonb,
  created_at timestamptz not null default now()
);
create index if not exists saved_reports_client_idx on public.saved_reports(client_id);
create index if not exists saved_reports_advisor_idx on public.saved_reports(advisor_id);
alter table public.saved_reports enable row level security;
drop policy if exists saved_reports_select on public.saved_reports;
drop policy if exists saved_reports_insert on public.saved_reports;
drop policy if exists saved_reports_update on public.saved_reports;
drop policy if exists saved_reports_delete on public.saved_reports;
create policy saved_reports_select on public.saved_reports for select to authenticated using (advisor_id = auth.uid() or public.is_admin());
create policy saved_reports_insert on public.saved_reports for insert to authenticated with check (advisor_id = auth.uid());
create policy saved_reports_update on public.saved_reports for update to authenticated using (advisor_id = auth.uid()) with check (advisor_id = auth.uid());
create policy saved_reports_delete on public.saved_reports for delete to authenticated using (advisor_id = auth.uid() or public.is_admin());
grant select, insert, update, delete on public.saved_reports to authenticated;

create table if not exists public.reports(
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text,
  kind text not null default 'growth',
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists reports_created_idx on public.reports(created_at desc);
alter table public.reports enable row level security;
drop policy if exists reports_select on public.reports;
drop policy if exists reports_insert on public.reports;
drop policy if exists reports_update on public.reports;
drop policy if exists reports_delete on public.reports;
create policy reports_select on public.reports for select to authenticated using (author_id = auth.uid() or public.is_leader());
create policy reports_insert on public.reports for insert to authenticated with check (author_id = auth.uid());
create policy reports_update on public.reports for update to authenticated using (author_id = auth.uid() or public.is_owner()) with check (author_id = auth.uid() or public.is_owner());
create policy reports_delete on public.reports for delete to authenticated using (author_id = auth.uid() or public.is_owner());
grant select, insert, update, delete on public.reports to authenticated;

create table if not exists public.ai_usage(
  member_id uuid not null references public.profiles(id) on delete cascade,
  usage_date date not null default current_date,
  cnt int not null default 0,
  primary key (member_id, usage_date)
);
alter table public.ai_usage enable row level security;
drop policy if exists ai_usage_select on public.ai_usage;
drop policy if exists ai_usage_write on public.ai_usage;
create policy ai_usage_select on public.ai_usage for select to authenticated using (member_id = auth.uid() or public.is_leader());
create policy ai_usage_write  on public.ai_usage for all    to authenticated using (member_id = auth.uid()) with check (member_id = auth.uid());
grant select, insert, update, delete on public.ai_usage to authenticated;

insert into public.app_config(key,value) values('growth_scope','all') on conflict (key) do nothing;

notify pgrst, 'reload schema';
