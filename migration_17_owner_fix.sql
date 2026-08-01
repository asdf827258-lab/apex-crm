set search_path = public;

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
drop policy if exists teams_write on public.teams;

drop policy if exists team_members_insert on public.team_members;
create policy team_members_insert on public.team_members for insert to authenticated
  with check (public.is_admin() or public.is_owner());
drop policy if exists team_members_delete on public.team_members;
create policy team_members_delete on public.team_members for delete to authenticated
  using (public.is_admin() or public.is_owner());
drop policy if exists team_members_write on public.team_members;

grant insert, update, delete on public.teams, public.team_members to authenticated;

select
  (select count(*) from public.profiles p join auth.users u on u.id = p.id
    where lower(btrim(u.email)) = 'asdf827258@gmail.com' and p.role = 'admin') as owner_role_admin,
  (select value from public.app_config where key = 'owner_email') as owner_email_set;

notify pgrst, 'reload schema';
