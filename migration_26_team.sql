set search_path = public;

alter table public.org_members add column if not exists member_id uuid;

create index if not exists org_members_member_idx on public.org_members(member_id);

create or replace function public.is_team_viewer()
returns boolean language sql stable security definer set search_path = public as $fn$
  select public.is_leader() or public.is_admin() or public.is_owner();
$fn$;

grant execute on function public.is_team_viewer() to authenticated;

do $blk$
declare
  t text;
  rls boolean;
begin
  foreach t in array array['dbs','calls'] loop
    if to_regclass('public.'||t) is null then
      continue;
    end if;
    execute format('grant select on public.%I to authenticated', t);
    select relrowsecurity into rls from pg_class where oid = ('public.'||t)::regclass;
    if not rls then
      continue;
    end if;
    execute format('drop policy if exists %I on public.%I', t||'_team_read', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_team_viewer())',
      t||'_team_read', t);
    if not exists(
      select 1 from pg_policies
       where schemaname = 'public' and tablename = t
         and cmd in ('INSERT','UPDATE','DELETE','ALL')
    ) then
      execute format('grant insert, update, delete on public.%I to authenticated', t);
      execute format(
        'create policy %I on public.%I for all to authenticated using (true) with check (true)',
        t||'_app_write', t);
    end if;
  end loop;
end
$blk$;

create or replace view public.team_overview as
select
  p.id                                as member_id,
  coalesce(nullif(btrim(p.name), ''), '이름 없음') as name,
  coalesce(p.role, 'member')          as role,
  coalesce(p.plan, '')                as plan,
  coalesce(p.active, true)            as active,
  o.id                                as org_id,
  coalesce(o.rank, '')                as org_rank,
  coalesce(o.team, '')                as org_team,
  coalesce(o.parent, '')              as org_parent
from public.profiles p
left join public.org_members o on o.member_id = p.id;

grant select on public.team_overview to authenticated;

notify pgrst, 'reload schema';

select
  (select count(*) from public.org_members where member_id is not null) as 계정연결된_조직원,
  (select count(*) from public.org_members)                            as 전체_조직원,
  to_regclass('public.team_overview') is not null                      as 통합조회_준비,
  (select count(*) from pg_policies where tablename = 'dbs'   and policyname = 'dbs_team_read')   as dbs_읽기정책,
  (select count(*) from pg_policies where tablename = 'calls' and policyname = 'calls_team_read') as calls_읽기정책;
