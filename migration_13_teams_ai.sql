-- 13: 팀(그룹) · 팀 성장 대시보드 · AI 부서 보고 · 아이디어 · 자동 백업 (재실행 안전)

-- ── 리더 판별 ────────────────────────────────────────────────
create or replace function public.is_leader()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.profiles
     where id=auth.uid() and active=true
       and role in ('admin','owner','lead','manager','leader')
  ) or public.is_owner();
$$;
grant execute on function public.is_leader() to authenticated;

-- ── 팀(그룹) ─────────────────────────────────────────────────
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

-- 팀 구성은 모든 로그인 사용자가 조회 가능(대시보드에서 그룹을 나눠 봐야 함)
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams for select to authenticated using (true);
drop policy if exists teams_write on public.teams;
create policy teams_write on public.teams for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members for select to authenticated using (true);
drop policy if exists team_members_write on public.team_members;
create policy team_members_write on public.team_members for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

grant select on public.teams, public.team_members to authenticated;
grant insert, update, delete on public.teams, public.team_members to authenticated;

-- ── AI 부서 보고 ──────────────────────────────────────────────
-- period: daily | weekly | monthly   dept: 부서 코드
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
-- 대표·리더만 열람 (팀원에게는 보이지 않음)
drop policy if exists ai_dept_reports_select on public.ai_dept_reports;
create policy ai_dept_reports_select on public.ai_dept_reports
  for select to authenticated using (public.is_leader());
drop policy if exists ai_dept_reports_write on public.ai_dept_reports;
create policy ai_dept_reports_write on public.ai_dept_reports
  for all to authenticated using (public.is_leader()) with check (public.is_leader());
grant select, insert, update, delete on public.ai_dept_reports to authenticated;

-- ── AI 아이디어 (승인만 남고, 해지하면 삭제) ─────────────────────
create table if not exists public.ai_ideas(
  id uuid primary key default gen_random_uuid(),
  dept text not null,
  dept_name text,
  title text not null,
  body text,
  expected_effect text,
  status text not null default 'pending',   -- pending | approved
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ai_ideas_status_idx on public.ai_ideas(status, created_at desc);

alter table public.ai_ideas enable row level security;
drop policy if exists ai_ideas_select on public.ai_ideas;
create policy ai_ideas_select on public.ai_ideas
  for select to authenticated using (public.is_leader());
drop policy if exists ai_ideas_write on public.ai_ideas;
create policy ai_ideas_write on public.ai_ideas
  for all to authenticated using (public.is_leader()) with check (public.is_leader());
grant select, insert, update, delete on public.ai_ideas to authenticated;

-- ⚠️ '해지'는 UPDATE(status='rejected')가 아니라 DELETE 로 처리한다.
--    승인한 아이디어만 남기고 해지한 것은 흔적을 남기지 않기 위함.

-- ── 자동 백업 ────────────────────────────────────────────────
create table if not exists public.backups(
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'daily',       -- daily | manual
  label text,
  ref_date date not null default current_date,
  rows_count int default 0,
  size_bytes int default 0,
  payload jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists backups_daily_uniq on public.backups(ref_date) where kind='daily';
create index if not exists backups_created_idx on public.backups(created_at desc);

alter table public.backups enable row level security;
drop policy if exists backups_select on public.backups;
create policy backups_select on public.backups
  for select to authenticated using (public.is_owner());
drop policy if exists backups_insert on public.backups;
create policy backups_insert on public.backups
  for insert to authenticated with check (public.is_leader());
drop policy if exists backups_delete on public.backups;
create policy backups_delete on public.backups
  for delete to authenticated using (public.is_owner());
grant select, insert, delete on public.backups to authenticated;

-- ── 팀 성장 대시보드 열람권 ────────────────────────────────────
-- app_config.key = 'growth_scope' : all(전원) | leader(리더 이상) | owner(대표만)
insert into public.app_config(key,value) values('growth_scope','all')
  on conflict (key) do nothing;
