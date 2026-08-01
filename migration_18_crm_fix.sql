set search_path = public;

alter table public.teams add column if not exists color text default '#1A56DB';
alter table public.teams add column if not exists leader_id uuid references public.profiles(id) on delete set null;
alter table public.teams add column if not exists goal_note text;
alter table public.teams add column if not exists created_at timestamptz not null default now();

create table if not exists public.team_members(
  team_id uuid not null references public.teams(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, member_id)
);

update public.profiles
   set role = 'admin', active = true, status = 'approved'
 where id in (select id from auth.users where lower(btrim(email)) = 'asdf827258@gmail.com');

insert into public.app_config(key, value)
values ('owner_email', 'asdf827258@gmail.com')
on conflict (key) do update set value = excluded.value, updated_at = now();

create or replace function public.is_owner()
returns boolean language plpgsql stable security definer set search_path=public as $fn$
declare oe text; me text;
begin
  begin
    select value into oe from public.app_config where key = 'owner_email' limit 1;
  exception when others then
    oe := null;
  end;
  select email into me from auth.users where id = auth.uid();
  if oe is null or btrim(oe) = '' then
    return exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','owner'));
  end if;
  return me is not null and lower(btrim(me)) = lower(btrim(oe));
end;
$fn$;
grant execute on function public.is_owner() to authenticated;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','owner','master','manager','lead','leader','member'));

drop policy if exists teams_insert on public.teams;
create policy teams_insert on public.teams for insert to authenticated
  with check (public.is_admin() or public.is_owner());
drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams for update to authenticated
  using (public.is_admin() or public.is_owner())
  with check (public.is_admin() or public.is_owner());
drop policy if exists teams_delete on public.teams;
create policy teams_delete on public.teams for delete to authenticated
  using (public.is_admin() or public.is_owner());

alter table public.team_members enable row level security;
drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members for select to authenticated using (true);
drop policy if exists team_members_insert on public.team_members;
create policy team_members_insert on public.team_members for insert to authenticated
  with check (public.is_admin() or public.is_owner());
drop policy if exists team_members_delete on public.team_members;
create policy team_members_delete on public.team_members for delete to authenticated
  using (public.is_admin() or public.is_owner());

grant select, insert, update, delete on public.teams, public.team_members to authenticated;

create or replace function public.is_viewer_all()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','owner','master') and coalesce(active,true) = true
  );
$fn$;
grant execute on function public.is_viewer_all() to authenticated;

drop policy if exists "dbs_master_select" on public.dbs;
create policy "dbs_master_select" on public.dbs
  for select to authenticated using (public.is_viewer_all());
drop policy if exists "calls_master_select" on public.calls;
create policy "calls_master_select" on public.calls
  for select to authenticated using (public.is_viewer_all());

update public.profiles p
   set workspace = 'crm'
  from auth.users u
 where u.id = p.id
   and lower(btrim(coalesce(u.email,''))) <> 'asdf827258@gmail.com'
   and coalesce(u.raw_user_meta_data->>'app','') <> 'apex'
   and coalesce(p.workspace,'both') <> 'apex';

update public.profiles p
   set workspace = 'both'
  from auth.users u
 where u.id = p.id
   and lower(btrim(coalesce(u.email,''))) = 'asdf827258@gmail.com';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $fn$
begin
  insert into public.profiles(id, name, role, status, workspace)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(coalesce(new.email,''),'@',1), ''),
          'member', 'pending',
          case when coalesce(new.raw_user_meta_data->>'app','') = 'apex' then 'apex' else 'crm' end)
  on conflict (id) do nothing;
  return new;
end;
$fn$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='teams'
      and column_name in ('color','leader_id','goal_note')) as teams_columns_3_expected,
  (select count(*) from public.profiles p join auth.users u on u.id = p.id
    where lower(btrim(u.email)) = 'asdf827258@gmail.com' and p.role = 'admin') as owner_admin_1_expected,
  (select count(*) from public.profiles where workspace = 'crm') as crm_members,
  (select count(*) from public.profiles where workspace in ('apex','both')) as apex_members;

notify pgrst, 'reload schema';
