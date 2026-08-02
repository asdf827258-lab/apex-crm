set search_path = public;

update public.profiles
   set workspace = 'both', status = 'approved', active = true
 where id in (
   select assigned_to from public.dbs where assigned_to is not null
   union
   select created_by from public.dbs where created_by is not null
   union
   select created_by from public.calls where created_by is not null
   union
   select member_id from public.attendance where member_id is not null
 );

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $fn$
begin
  insert into public.profiles(id, name, role, status, workspace)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(coalesce(new.email,''),'@',1), ''),
          'member', 'pending', 'apex')
  on conflict (id) do nothing;
  return new;
end;
$fn$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

select
  (select count(*) from public.profiles where workspace = 'both' and status = 'approved') as linked_members,
  (select count(*) from public.profiles where workspace = 'crm') as dormant_crm_only,
  (select count(*) from public.profiles where status = 'pending') as waiting_approval;

notify pgrst, 'reload schema';
