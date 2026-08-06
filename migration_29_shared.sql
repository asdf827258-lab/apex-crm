set search_path = public;

drop policy if exists suggestions_read on public.suggestions;
create policy suggestions_read on public.suggestions
  for select to authenticated
  using (true);

grant select on public.suggestions to authenticated;

drop policy if exists org_members_read on public.org_members;
create policy org_members_read on public.org_members
  for select to authenticated
  using (true);

grant select on public.org_members to authenticated;

notify pgrst, 'reload schema';

select
  (select count(*) from public.suggestions) as 건의_전체,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'suggestions' and cmd = 'SELECT') as 건의_읽기정책,
  (select count(*) from public.org_members) as 조직원,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'org_members' and cmd = 'SELECT') as 조직도_읽기정책;
