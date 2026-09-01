set search_path = public;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists(
    select 1 from public.profiles
     where id = auth.uid() and role in ('admin','owner')
  );
$fn$;

create or replace function public.is_owner()
returns boolean language plpgsql stable security definer set search_path = public as $fn$
declare oe text; me text;
begin
  begin
    select value into oe from public.app_config where key = 'owner_email' limit 1;
  exception when others then
    oe := null;
  end;
  select email into me from auth.users where id = auth.uid();
  if oe is null or oe = '' then
    return exists(select 1 from public.profiles
                   where id = auth.uid() and role in ('admin','owner'));
  end if;
  return me is not null and lower(me) = lower(oe);
end;
$fn$;

create or replace function public.is_leader()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists(
    select 1 from public.profiles
     where id = auth.uid() and coalesce(active,true) = true
       and role in ('admin','owner','lead','manager','leader','master')
  ) or public.is_owner();
$fn$;

create or replace function public.is_team_viewer()
returns boolean language sql stable security definer set search_path = public as $fn$
  select public.is_leader() or public.is_admin() or public.is_owner();
$fn$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.is_leader() to authenticated;
grant execute on function public.is_team_viewer() to authenticated;

create table if not exists public.org_members(
  id text primary key,
  name text not null default '',
  rank text default '설계사',
  team text default '',
  parent text default '',
  phone text default '',
  insta text default '',
  photo text default '',
  member_id uuid,
  updated_at timestamptz default now(),
  updated_by uuid
);

alter table public.org_members add column if not exists member_id uuid;
alter table public.org_members add column if not exists updated_at timestamptz default now();
alter table public.org_members add column if not exists updated_by uuid;

create index if not exists org_members_member_idx on public.org_members(member_id);

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

create table if not exists public.daily_checks(
  member_id uuid not null,
  check_date date not null,
  scope text not null default 'day',
  items jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  primary key (member_id, check_date, scope)
);

alter table public.daily_checks add column if not exists items jsonb not null default '{}'::jsonb;
alter table public.daily_checks add column if not exists updated_at timestamptz default now();

create index if not exists daily_checks_date_idx on public.daily_checks(check_date desc);
create index if not exists daily_checks_member_idx on public.daily_checks(member_id);

alter table public.daily_checks enable row level security;

drop policy if exists daily_checks_read on public.daily_checks;
create policy daily_checks_read on public.daily_checks
  for select to authenticated
  using (member_id = auth.uid() or public.is_team_viewer());

drop policy if exists daily_checks_insert on public.daily_checks;
create policy daily_checks_insert on public.daily_checks
  for insert to authenticated with check (member_id = auth.uid());

drop policy if exists daily_checks_update on public.daily_checks;
create policy daily_checks_update on public.daily_checks
  for update to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

drop policy if exists daily_checks_delete on public.daily_checks;
create policy daily_checks_delete on public.daily_checks
  for delete to authenticated
  using (member_id = auth.uid() or public.is_admin() or public.is_owner());

grant select on public.daily_checks to authenticated;
grant insert, update, delete on public.daily_checks to authenticated;

create table if not exists public.health_checks(
  member_id uuid not null,
  check_date date not null,
  checked_at timestamptz default now(),
  ok_count integer default 0,
  warn_count integer default 0,
  bad_count integer default 0,
  detail jsonb not null default '[]'::jsonb,
  primary key (member_id, check_date)
);

alter table public.health_checks add column if not exists checked_at timestamptz default now();
alter table public.health_checks add column if not exists detail jsonb not null default '[]'::jsonb;

create index if not exists health_checks_date_idx on public.health_checks(check_date desc);

alter table public.health_checks enable row level security;

drop policy if exists health_checks_read on public.health_checks;
create policy health_checks_read on public.health_checks
  for select to authenticated
  using (member_id = auth.uid() or public.is_team_viewer());

drop policy if exists health_checks_insert on public.health_checks;
create policy health_checks_insert on public.health_checks
  for insert to authenticated with check (member_id = auth.uid());

drop policy if exists health_checks_update on public.health_checks;
create policy health_checks_update on public.health_checks
  for update to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

drop policy if exists health_checks_delete on public.health_checks;
create policy health_checks_delete on public.health_checks
  for delete to authenticated
  using (member_id = auth.uid() or public.is_admin() or public.is_owner());

grant select on public.health_checks to authenticated;
grant insert, update, delete on public.health_checks to authenticated;

create table if not exists public.suggestions(
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null,
  author_name text default '',
  kind text not null default 'idea',
  title text not null default '',
  body text not null default '',
  context jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  reply text default '',
  replied_by uuid,
  replied_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.suggestions add column if not exists author_name text default '';
alter table public.suggestions add column if not exists context jsonb not null default '{}'::jsonb;
alter table public.suggestions add column if not exists reply text default '';
alter table public.suggestions add column if not exists replied_by uuid;
alter table public.suggestions add column if not exists replied_at timestamptz;
alter table public.suggestions add column if not exists updated_at timestamptz default now();

create index if not exists suggestions_created_idx on public.suggestions(created_at desc);
create index if not exists suggestions_member_idx on public.suggestions(member_id);
create index if not exists suggestions_status_idx on public.suggestions(status);

alter table public.suggestions enable row level security;

drop policy if exists suggestions_read on public.suggestions;
create policy suggestions_read on public.suggestions
  for select to authenticated
  using (true);

drop policy if exists suggestions_insert on public.suggestions;
create policy suggestions_insert on public.suggestions
  for insert to authenticated with check (member_id = auth.uid());

drop policy if exists suggestions_update_own on public.suggestions;
create policy suggestions_update_own on public.suggestions
  for update to authenticated
  using (member_id = auth.uid() and status = 'new')
  with check (member_id = auth.uid());

drop policy if exists suggestions_update_admin on public.suggestions;
create policy suggestions_update_admin on public.suggestions
  for update to authenticated
  using (public.is_admin() or public.is_owner())
  with check (public.is_admin() or public.is_owner());

drop policy if exists suggestions_delete on public.suggestions;
create policy suggestions_delete on public.suggestions
  for delete to authenticated
  using ((member_id = auth.uid() and status = 'new') or public.is_admin() or public.is_owner());

grant select on public.suggestions to authenticated;
grant insert, update, delete on public.suggestions to authenticated;

create table if not exists public.coach_logs(
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null,
  coach_id uuid not null,
  coach_date date not null default current_date,
  strength text default '',
  weak text default '',
  todo text default '',
  recheck_date date,
  note text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.coach_logs add column if not exists strength text default '';
alter table public.coach_logs add column if not exists weak text default '';
alter table public.coach_logs add column if not exists todo text default '';
alter table public.coach_logs add column if not exists recheck_date date;
alter table public.coach_logs add column if not exists note text default '';
alter table public.coach_logs add column if not exists updated_at timestamptz default now();

create index if not exists coach_logs_member_idx on public.coach_logs(member_id);
create index if not exists coach_logs_date_idx on public.coach_logs(coach_date desc);
create index if not exists coach_logs_recheck_idx on public.coach_logs(recheck_date);

alter table public.coach_logs enable row level security;

drop policy if exists coach_logs_read on public.coach_logs;
create policy coach_logs_read on public.coach_logs
  for select to authenticated
  using (member_id = auth.uid() or coach_id = auth.uid() or public.is_team_viewer());

drop policy if exists coach_logs_insert on public.coach_logs;
create policy coach_logs_insert on public.coach_logs
  for insert to authenticated with check (coach_id = auth.uid());

drop policy if exists coach_logs_update on public.coach_logs;
create policy coach_logs_update on public.coach_logs
  for update to authenticated
  using (coach_id = auth.uid() or public.is_admin() or public.is_owner())
  with check (coach_id = auth.uid() or public.is_admin() or public.is_owner());

drop policy if exists coach_logs_delete on public.coach_logs;
create policy coach_logs_delete on public.coach_logs
  for delete to authenticated
  using (coach_id = auth.uid() or public.is_admin() or public.is_owner());

grant select on public.coach_logs to authenticated;
grant insert, update, delete on public.coach_logs to authenticated;

do $blk$
declare
  t text;
  rls boolean;
  n_write integer;
begin
  foreach t in array array['dbs','calls'] loop
    if to_regclass('public.'||t) is null then
      continue;
    end if;

    execute format('grant select, insert, update, delete on public.%I to authenticated', t);

    select relrowsecurity into rls from pg_class where oid = ('public.'||t)::regclass;
    if not rls then
      continue;
    end if;

    select count(*) into n_write
      from pg_policies
     where schemaname = 'public' and tablename = t
       and cmd in ('INSERT','UPDATE','DELETE','ALL');

    if n_write = 0 then
      execute format(
        'create policy %I on public.%I for all to authenticated using (true) with check (true)',
        t||'_app_write', t);
    end if;

    if not exists(
      select 1 from pg_policies
       where schemaname = 'public' and tablename = t and policyname = t||'_team_read'
    ) then
      execute format(
        'create policy %I on public.%I for select to authenticated using (public.is_team_viewer())',
        t||'_team_read', t);
    end if;
  end loop;
end
$blk$;

/* security_invoker — 이 뷰를 부르는 사람의 권한(RLS)으로 본다.
   안 켜면 만든 사람 권한으로 도는 SECURITY DEFINER 가 되어, 아래 두 표에
   걸어 둔 행 보안이 이 뷰를 지나 새 나간다(Supabase 린터가 잡아 준 자리).
   profiles·org_members 둘 다 authenticated 읽기를 이미 허용하므로
   켜도 팀 화면이 비지 않는다. */
create or replace view public.team_overview
  with (security_invoker = on) as
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

create table if not exists public.coach_notes(
  id uuid primary key default gen_random_uuid(),
  log_id uuid,
  member_id uuid not null,
  body text not null default '',
  mood text default '',
  share boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.coach_notes add column if not exists log_id uuid;
alter table public.coach_notes add column if not exists mood text default '';
alter table public.coach_notes add column if not exists share boolean not null default false;
alter table public.coach_notes add column if not exists updated_at timestamptz default now();

create index if not exists coach_notes_member_idx on public.coach_notes(member_id, created_at desc);
create index if not exists coach_notes_log_idx on public.coach_notes(log_id);
create index if not exists coach_notes_share_idx on public.coach_notes(share, created_at desc);

alter table public.coach_notes enable row level security;

drop policy if exists coach_notes_read on public.coach_notes;
create policy coach_notes_read on public.coach_notes
  for select to authenticated
  using (
    member_id = auth.uid()
    or (share = true and public.is_team_viewer())
  );

drop policy if exists coach_notes_insert on public.coach_notes;
create policy coach_notes_insert on public.coach_notes
  for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists coach_notes_update on public.coach_notes;
create policy coach_notes_update on public.coach_notes
  for update to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

drop policy if exists coach_notes_delete on public.coach_notes;
create policy coach_notes_delete on public.coach_notes
  for delete to authenticated
  using (member_id = auth.uid() or public.is_admin() or public.is_owner());

grant select on public.coach_notes to authenticated;
grant insert, update, delete on public.coach_notes to authenticated;

create table if not exists public.app_config(
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

grant select on public.app_config to authenticated;

create table if not exists public.legal_consents(
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null,
  kind text not null,
  version text not null default '1',
  agreed boolean not null default true,
  agreed_at timestamptz default now(),
  meta jsonb not null default '{}'::jsonb
);

alter table public.legal_consents add column if not exists version text not null default '1';
alter table public.legal_consents add column if not exists agreed boolean not null default true;
alter table public.legal_consents add column if not exists meta jsonb not null default '{}'::jsonb;

create unique index if not exists legal_consents_uniq
  on public.legal_consents(member_id, kind, version);
create index if not exists legal_consents_member_idx on public.legal_consents(member_id);
create index if not exists legal_consents_kind_idx on public.legal_consents(kind, agreed_at desc);

alter table public.legal_consents enable row level security;

drop policy if exists legal_consents_read on public.legal_consents;
create policy legal_consents_read on public.legal_consents
  for select to authenticated
  using (member_id = auth.uid() or public.is_admin() or public.is_owner());

drop policy if exists legal_consents_insert on public.legal_consents;
create policy legal_consents_insert on public.legal_consents
  for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists legal_consents_update on public.legal_consents;
create policy legal_consents_update on public.legal_consents
  for update to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

grant select on public.legal_consents to authenticated;
grant insert, update on public.legal_consents to authenticated;

insert into public.app_config(key, value) values
  ('biz_name',      ''),
  ('biz_ceo',       ''),
  ('biz_no',        ''),
  ('biz_addr',      ''),
  ('biz_tel',       ''),
  ('biz_email',     ''),
  ('biz_mailorder', ''),
  ('privacy_officer', '')
on conflict (key) do nothing;

insert into public.app_config(key, value)
values ('schema_version', '32')
on conflict (key) do update set value = excluded.value, updated_at = now();

notify pgrst, 'reload schema';

select
  '조직도'       as 화면, to_regclass('public.org_members') is not null as 표_준비,
  (select count(*) from pg_policies where schemaname='public' and tablename='org_members') as 정책수
union all select
  '실행 체크판', to_regclass('public.daily_checks') is not null,
  (select count(*) from pg_policies where schemaname='public' and tablename='daily_checks')
union all select
  '시스템 점검', to_regclass('public.health_checks') is not null,
  (select count(*) from pg_policies where schemaname='public' and tablename='health_checks')
union all select
  '건의함(전원 공개)', to_regclass('public.suggestions') is not null,
  (select count(*) from pg_policies where schemaname='public' and tablename='suggestions')
union all select
  '팀 코칭', to_regclass('public.coach_logs') is not null,
  (select count(*) from pg_policies where schemaname='public' and tablename='coach_logs')
union all select
  'DB CRM 쓰기', to_regclass('public.dbs') is not null,
  (select count(*) from pg_policies where schemaname='public' and tablename='dbs'
     and cmd in ('INSERT','UPDATE','DELETE','ALL'))
union all select
  '팀원 종합 뷰', to_regclass('public.team_overview') is not null, 0
union all select
  '밤 작업', to_regclass('public.night_briefs') is not null,
  (select count(*) from pg_policies where schemaname='public' and tablename='night_briefs')
union all select
  '내 코칭', to_regclass('public.coach_notes') is not null,
  (select count(*) from pg_policies where schemaname='public' and tablename='coach_notes')
union all select
  '약관 동의 기록', to_regclass('public.legal_consents') is not null,
  (select count(*) from pg_policies where schemaname='public' and tablename='legal_consents');
