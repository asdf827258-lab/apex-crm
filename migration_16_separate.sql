set search_path = public;

alter table public.profiles add column if not exists workspace text default 'both';
update public.profiles set workspace = 'both' where workspace is null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $fn$
begin
  insert into public.profiles(id, name, role, status, workspace)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(coalesce(new.email,''),'@',1), ''),
          'member', 'pending',
          coalesce(nullif(new.raw_user_meta_data->>'app',''), 'both'))
  on conflict (id) do nothing;
  return new;
end;
$fn$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

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

drop policy if exists team_members_insert on public.team_members;
create policy team_members_insert on public.team_members for insert to authenticated
  with check (public.is_admin() or public.is_owner());
drop policy if exists team_members_delete on public.team_members;
create policy team_members_delete on public.team_members for delete to authenticated
  using (public.is_admin() or public.is_owner());

drop policy if exists backups_select on public.backups;
create policy backups_select on public.backups for select to authenticated
  using (public.is_admin() or public.is_owner());
drop policy if exists backups_delete on public.backups;
create policy backups_delete on public.backups for delete to authenticated
  using (public.is_admin() or public.is_owner());

notify pgrst, 'reload schema';
