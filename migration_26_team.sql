set search_path = public;

alter table public.org_members add column if not exists member_id uuid;

create index if not exists org_members_member_idx on public.org_members(member_id);

create or replace function public.is_team_viewer()
returns boolean language sql stable security definer set search_path = public as $fn$
  select public.is_leader() or public.is_admin() or public.is_owner();
$fn$;

grant execute on function public.is_team_viewer() to authenticated;

do $blk$
begin
  if to_regclass('public.dbs') is not null then
    execute 'alter table public.dbs enable row level security';
    execute 'drop policy if exists dbs_team_read on public.dbs';
    execute 'create policy dbs_team_read on public.dbs for select to authenticated using (public.is_team_viewer())';
    execute 'grant select on public.dbs to authenticated';
  end if;
  if to_regclass('public.calls') is not null then
    execute 'alter table public.calls enable row level security';
    execute 'drop policy if exists calls_team_read on public.calls';
    execute 'create policy calls_team_read on public.calls for select to authenticated using (public.is_team_viewer())';
    execute 'grant select on public.calls to authenticated';
  end if;
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
