/* ════════════════════════════════════════════════════════════════
   APEX YUN PRO — 남은 것 한 번에 (2026-08-11)

   그동안 따로따로 드린 SQL 세 가지를 하나로 합쳤습니다.
   이것 하나만 붙여넣고 Run 하시면 됩니다.

     ① 조직도 서버 저장      org_members
        → 어느 컴퓨터에서나 같은 조직도를 보고 고칩니다
        → 안 하면 조직도가 이 컴퓨터에만 남습니다

     ② 동의 기록             legal_consents
        → AI 보장분석·제안서·비포애프터 등 고객 자료 도구 15개
        → 안 해도 일은 되지만, 개인정보보호법상 동의 기록은 남겨야 합니다

     ③ DB 종류 팀원 개방     app_config 의 db_sources 한 줄
        → 팀원이 「＋ DB 종류 추가」 로 직접 종류를 만들고 뺍니다
        → 다른 설정(대표 이메일·결제)은 그대로 대표만

   어떤 상태에서 돌려도 멈추지 않습니다. 표가 없으면 만들고, 제약이
   없으면 넣고, 이미 있으면 건드리지 않습니다.
   몇 번을 다시 실행해도 안전합니다.

   맨 끝에 결과 표가 뜹니다. 그 표가 보이면 끝난 것입니다.
   ════════════════════════════════════════════════════════════════ */

set search_path = public;

/* ════════ ① 조직도 ════════ */

create table if not exists public.org_members(
  id text primary key,
  name text not null default '',
  rank text default '설계사',
  team text default '',
  parent text default '',
  phone text default '',
  insta text default '',
  photo text default '',
  updated_at timestamptz default now(),
  updated_by uuid
);

alter table public.org_members add column if not exists updated_at timestamptz default now();
alter table public.org_members add column if not exists updated_by uuid;

/* 조직도의 사람과 앱 계정을 잇는 칸. 이게 있어야 「전체 반영」 이 됩니다. */
alter table public.org_members add column if not exists member_id uuid;

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

/* ════════ ② 동의 기록 ════════ */

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

grant select, insert, update on public.legal_consents to authenticated;

/* ════════ ③ DB 종류를 팀원도 ════════ */

create table if not exists public.app_config(
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

alter table public.app_config enable row level security;

grant select, insert, update on public.app_config to authenticated;

/* key 에 고유 제약이 없는 옛 표라면 넣어 준다 — 없으면 아래 insert 가 멈춘다 */
do $mig$
begin
  if not exists (
    select 1 from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
    where i.indrelid = 'public.app_config'::regclass
      and i.indisunique
      and a.attname = 'key'
  ) then
    execute 'create unique index app_config_key_uniq on public.app_config(key)';
  end if;
end
$mig$;

drop policy if exists app_config_select on public.app_config;
create policy app_config_select on public.app_config for select to authenticated
using (true);

/* 대표·운영자는 모든 설정을 고친다. 이미 있으면 그대로 다시 건다. */
drop policy if exists app_config_write on public.app_config;
create policy app_config_write on public.app_config for all to authenticated
using (public.is_owner() or public.is_admin())
with check (public.is_owner() or public.is_admin());

/* db_sources 한 줄만 팀원이 넣고 고친다. 다른 줄은 못 건드린다. */
drop policy if exists app_config_src_insert on public.app_config;
create policy app_config_src_insert on public.app_config for insert to authenticated
with check (key = 'db_sources');

drop policy if exists app_config_src_update on public.app_config;
create policy app_config_src_update on public.app_config for update to authenticated
using (key = 'db_sources')
with check (key = 'db_sources');

insert into public.app_config(key, value)
select 'db_sources', '일반,방송,보장분석,농협,소개,지인,개척'
where not exists (select 1 from public.app_config where key = 'db_sources');

/* ════════ 마무리 ════════ */

notify pgrst, 'reload schema';

select
  '조직도 표'        as 항목,
  (to_regclass('public.org_members') is not null)::text as 준비됨,
  coalesce((select count(*)::text from public.org_members), '0') as 값
union all
select '조직도 계정연결 칸',
  (exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='org_members' and column_name='member_id'))::text,
  ''
union all
select '동의 기록 표',
  (to_regclass('public.legal_consents') is not null)::text,
  coalesce((select count(*)::text from public.legal_consents where kind='sensitive'), '0')
union all
select 'DB 종류 목록',
  (exists(select 1 from public.app_config where key='db_sources'))::text,
  coalesce((select value from public.app_config where key='db_sources'), '')
union all
select 'DB 종류 팀원 개방',
  (exists(select 1 from pg_policies
    where tablename='app_config' and policyname='app_config_src_update'))::text,
  '';
