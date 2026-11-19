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

create table if not exists public.mbti_tests(
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null,
  subject_name text not null default '',
  subject_kind text not null default 'client',
  memo text default '',
  answers jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  type_code text default '',
  consistency int default 0,
  paid boolean not null default false,
  paid_at timestamptz,
  pay_method text default '',
  order_id text,
  amount int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.mbti_tests add column if not exists memo text default '';
alter table public.mbti_tests add column if not exists consistency int default 0;
alter table public.mbti_tests add column if not exists paid boolean not null default false;
alter table public.mbti_tests add column if not exists paid_at timestamptz;
alter table public.mbti_tests add column if not exists pay_method text default '';
alter table public.mbti_tests add column if not exists order_id text;
alter table public.mbti_tests add column if not exists amount int;
alter table public.mbti_tests add column if not exists updated_at timestamptz default now();

create index if not exists mbti_tests_member_idx on public.mbti_tests(member_id, created_at desc);
create index if not exists mbti_tests_paid_idx on public.mbti_tests(paid, created_at desc);
create index if not exists mbti_tests_order_idx on public.mbti_tests(order_id);

alter table public.mbti_tests enable row level security;

drop policy if exists mbti_tests_read on public.mbti_tests;
create policy mbti_tests_read on public.mbti_tests
  for select to authenticated
  using (member_id = auth.uid() or public.is_admin() or public.is_owner());

drop policy if exists mbti_tests_insert on public.mbti_tests;
create policy mbti_tests_insert on public.mbti_tests
  for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists mbti_tests_update on public.mbti_tests;
create policy mbti_tests_update on public.mbti_tests
  for update to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

drop policy if exists mbti_tests_delete on public.mbti_tests;
create policy mbti_tests_delete on public.mbti_tests
  for delete to authenticated
  using (member_id = auth.uid() or public.is_admin() or public.is_owner());

revoke all on public.mbti_tests from authenticated;

grant select on public.mbti_tests to authenticated;
grant delete on public.mbti_tests to authenticated;

grant insert (id, member_id, subject_name, subject_kind, memo, answers, scores, type_code, consistency, created_at)
  on public.mbti_tests to authenticated;

grant update (subject_name, subject_kind, memo, answers, scores, type_code, consistency, updated_at)
  on public.mbti_tests to authenticated;

create or replace function public.mbti_mark_paid(p_id uuid, p_method text default 'manual')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  hit boolean;
begin
  if not (public.is_admin() or public.is_owner()) then
    return false;
  end if;
  update public.mbti_tests
     set paid = true,
         paid_at = now(),
         pay_method = coalesce(p_method, 'manual'),
         updated_at = now()
   where id = p_id;
  get diagnostics hit = row_count;
  return hit;
end;
$$;

revoke all on function public.mbti_mark_paid(uuid, text) from public;
grant execute on function public.mbti_mark_paid(uuid, text) to authenticated;

create table if not exists public.worry_orders(
  id uuid primary key default gen_random_uuid(),
  order_id text,
  payment_key text,
  amount int,
  buyer_name text default '',
  agent_name text default '',
  status text not null default 'paid',
  created_at timestamptz default now()
);

alter table public.worry_orders add column if not exists buyer_name text default '';
alter table public.worry_orders add column if not exists agent_name text default '';
alter table public.worry_orders add column if not exists status text not null default 'paid';

create index if not exists worry_orders_created_idx on public.worry_orders(created_at desc);
create unique index if not exists worry_orders_order_uniq on public.worry_orders(order_id);

alter table public.worry_orders enable row level security;

drop policy if exists worry_orders_read on public.worry_orders;
create policy worry_orders_read on public.worry_orders
  for select to authenticated
  using (public.is_admin() or public.is_owner());

revoke all on public.worry_orders from authenticated;
grant select on public.worry_orders to authenticated;

/* ========================================================== */
/* 채용 대기열 (recruits) — 후보가 제출하면 서버 함수가 여기에 쌓는다.  */
/* 읽기는 관리자·대표와 배정된 설계사만. 넣는 것은 서버 함수만 한다.   */
/* ========================================================== */
create table if not exists public.recruits(
  id            uuid primary key default gen_random_uuid(),
  /* 어디서 들어왔나 */
  org           text not null default '',   /* 본부/지점 */
  recruiter     text not null default '',   /* 담당 설계사 이름(링크에 담긴 값) */
  recruiter_id  uuid,   /* 담당 설계사 계정(있으면 배정) */
  source        text not null default 'link',   /* link · qr · seminar */
  /* 후보가 적어낸 것 */
  name          text not null default '',
  phone         text not null default '',
  phone_hash    text,   /* 같은 사람이 여러 번 내도 한 줄로 합친다 */
  contact_time  text not null default '',   /* 연락 가능한 시간대 */
  intent        text not null default '',   /* now · soon · maybe · no */
  memo          text not null default '',   /* 후보가 남긴 한마디 */
  /* 검사 결과 */
  gender        text not null default '',
  birth_y       int,
  birth_m       int,
  birth_d       int,
  birth_h       int,
  no_time       boolean not null default false,
  mbti          text not null default '',
  blood         text not null default '',
  day_gz        text not null default '',   /* 일주(갑자 두 글자) */
  saju          jsonb not null default '{}'::jsonb,
  answers       jsonb not null default '{}'::jsonb,
  scores        jsonb not null default '{}'::jsonb,
  consistency   int not null default 0,
  /* 행동 신호 — 우선순위를 정하는 재료 (성향이 아니다) */
  finished      boolean not null default false,   /* 48문항을 끝까지 했는가 */
  elapsed_sec   int not null default 0,   /* 검사에 걸린 시간 */
  /* 운영 */
  stage         text not null default 'new',   /* new · contacted · met · joined · hold · closed */
  owner_note    text not null default '',
  /* 개인정보 */
  consent       boolean not null default false,
  consent_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

/* 이미 만들어진 곳에서도 안전하게 돌도록 */
alter table public.recruits add column if not exists recruiter_id uuid;
alter table public.recruits add column if not exists phone_hash   text;
alter table public.recruits add column if not exists day_gz       text not null default '';
alter table public.recruits add column if not exists owner_note   text not null default '';
alter table public.recruits add column if not exists elapsed_sec  int  not null default 0;
alter table public.recruits add column if not exists updated_at   timestamptz not null default now();

create index if not exists recruits_created_idx  on public.recruits(created_at desc);
create index if not exists recruits_stage_idx    on public.recruits(stage, created_at desc);
create index if not exists recruits_owner_idx    on public.recruits(recruiter_id, created_at desc);
/* 같은 번호로 다시 내면 새 줄을 만들지 않고 기존 줄을 갱신한다 */
create unique index if not exists recruits_phone_uniq
  on public.recruits(phone_hash);
/* 이미 부분 인덱스로 만들어 둔 곳이라면 지워 준다. 둘 다 있어도 동작은
   같지만, 쓰기마다 인덱스를 두 번 고치게 되므로 하나만 남긴다.
   (라이브에는 recruits_phone_uniq_all 이라는 이름으로 먼저 들어가 있다) */
drop index if exists public.recruits_phone_uniq_all;

alter table public.recruits enable row level security;

/* 읽기 — 관리자·대표, 또는 자기에게 배정된 건 */
drop policy if exists recruits_read on public.recruits;
create policy recruits_read on public.recruits
  for select to authenticated
  using (public.is_admin() or public.is_owner() or recruiter_id = auth.uid());

/* 고치기 — 같은 범위. 단, 고칠 수 있는 칸은 아래 grant 로 묶는다 */
drop policy if exists recruits_update on public.recruits;
create policy recruits_update on public.recruits
  for update to authenticated
  using (public.is_admin() or public.is_owner() or recruiter_id = auth.uid())
  with check (public.is_admin() or public.is_owner() or recruiter_id = auth.uid());

/* 지우기 — 관리자·대표만 */
drop policy if exists recruits_delete on public.recruits;
create policy recruits_delete on public.recruits
  for delete to authenticated
  using (public.is_admin() or public.is_owner());

revoke all on public.recruits from anon, authenticated;

grant select on public.recruits to authenticated;
grant delete on public.recruits to authenticated;
/* 앱에서 고칠 수 있는 것은 진행 단계·메모·담당자뿐. */
/* 후보가 적어낸 값과 검사 결과는 앱에서 못 바꾼다. */
grant update (stage, owner_note, recruiter_id, updated_at) on public.recruits to authenticated;
/* insert 권한은 아무에게도 주지 않는다. 서버 함수(service_role)만 넣는다. */

/* 보관기간 — 지난 건은 지운다. 기본 180일. */
create or replace function public.recruits_purge(p_days int default 180)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if not (public.is_admin() or public.is_owner()) then
    return 0;
  end if;
  delete from public.recruits
   where created_at < now() - (greatest(p_days, 30) || ' days')::interval
     and stage <> 'joined';
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.recruits_purge(int) from public;
grant execute on function public.recruits_purge(int) to authenticated;

/* ========================================================== */
/* 채용 3단계 — 후속 일정(next_at)과 담당자 배정(assigned_at).       */
/* ========================================================== */
alter table public.recruits add column if not exists next_at     timestamptz;
alter table public.recruits add column if not exists assigned_at timestamptz;

create index if not exists recruits_next_idx on public.recruits(next_at)
  where next_at is not null;

/* 앱에서 고칠 수 있는 칸에 둘을 더한다. 후보가 적어낸 값과 검사 결과는 */
/* 여전히 앱에서 못 바꾼다.                                              */
grant update (stage, owner_note, recruiter_id, updated_at, next_at, assigned_at)
  on public.recruits to authenticated;

/* 담당자 없는 건을 팀원들에게 돌아가며 나눠 맡긴다.                     */
/* 관리자·대표만 쓸 수 있고, 이미 담당자가 있는 건은 건드리지 않는다.    */
create or replace function public.recruits_assign(p_ids uuid[], p_owner uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if not (public.is_admin() or public.is_owner()) then
    return 0;
  end if;
  if p_owner is null or not exists (select 1 from public.profiles where id = p_owner) then
    return 0;
  end if;
  update public.recruits
     set recruiter_id = p_owner,
         assigned_at  = now(),
         updated_at   = now()
   where id = any(p_ids)
     and recruiter_id is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.recruits_assign(uuid[], uuid) from public;
grant execute on function public.recruits_assign(uuid[], uuid) to authenticated;

/* ========================================================== */
/* 채용 4단계 — 단계별 시각 기록. 응답 속도와 전환율을 재기 위한 칸. */
/* ========================================================== */
alter table public.recruits add column if not exists contacted_at timestamptz;
alter table public.recruits add column if not exists met_at       timestamptz;
alter table public.recruits add column if not exists joined_at    timestamptz;

create index if not exists recruits_joined_idx on public.recruits(joined_at)
  where joined_at is not null;

grant update (stage, owner_note, recruiter_id, updated_at, next_at, assigned_at,
              contacted_at, met_at, joined_at)
  on public.recruits to authenticated;

/* ========================================================== */
/* 채용 6단계 — 입사 이후. 위촉일·이탈일로 13주 정착을 잰다.        */
/* ========================================================== */
alter table public.recruits add column if not exists started_at  timestamptz;
alter table public.recruits add column if not exists left_at     timestamptz;
alter table public.recruits add column if not exists left_reason text not null default '';

create index if not exists recruits_started_idx on public.recruits(started_at)
  where started_at is not null;

grant update (stage, owner_note, recruiter_id, updated_at, next_at, assigned_at,
              contacted_at, met_at, joined_at, started_at, left_at, left_reason)
  on public.recruits to authenticated;

/* ========================================================== */
/* 채용 7단계 — 장난 제출 막기(ip_hash)와 문자 발송 기록.           */
/* ========================================================== */
alter table public.recruits add column if not exists ip_hash text;

create index if not exists recruits_ip_idx on public.recruits(ip_hash, created_at desc)
  where ip_hash is not null;

create table if not exists public.recruit_sends(
  id          uuid primary key default gen_random_uuid(),
  sent_by     uuid,
  sent_name   text not null default '',
  segment     text not null default '',
  total       int  not null default 0,
  ok_count    int  not null default 0,
  fail_count  int  not null default 0,
  dry_run     boolean not null default false,
  note        text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists recruit_sends_created_idx on public.recruit_sends(created_at desc);

alter table public.recruit_sends enable row level security;

drop policy if exists recruit_sends_read on public.recruit_sends;
create policy recruit_sends_read on public.recruit_sends
  for select to authenticated
  using (public.is_admin() or public.is_owner() or sent_by = auth.uid());

revoke all on public.recruit_sends from anon, authenticated;
grant select on public.recruit_sends to authenticated;
/* insert 권한은 아무에게도 주지 않는다 — 서버 함수(service_role)만 적는다 */

/* schema_version 은 적지 않는다. 메인은 47 이후로 이 값을 더 이상
   쓰지 않는데, 여기서 적으면 라이브(47)를 더 낮은 숫자로 되돌려
   버린다. 버전 표시는 버려진 칸이라 건드리지 않는다. */
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
  '채용 대기열', to_regclass('public.recruits') is not null,
  (select count(*) from pg_policies where schemaname='public' and tablename='recruits')
union all select
  '내 코칭', to_regclass('public.coach_notes') is not null,
  (select count(*) from pg_policies where schemaname='public' and tablename='coach_notes')
union all select
  '약관 동의 기록', to_regclass('public.legal_consents') is not null,
  (select count(*) from pg_policies where schemaname='public' and tablename='legal_consents')
union all select
  '성향검사 48', to_regclass('public.mbti_tests') is not null,
  (select count(*) from pg_policies where schemaname='public' and tablename='mbti_tests')
union all select
  '고민 상담 결제', to_regclass('public.worry_orders') is not null,
  (select count(*) from pg_policies where schemaname='public' and tablename='worry_orders');
