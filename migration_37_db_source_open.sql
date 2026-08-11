/* ════════════════════════════════════════════════════════════════
   DB 종류 목록을 팀원 누구나 고칠 수 있게 한다

   36번에서 종류 목록을 app_config 의 db_sources 한 줄에 넣었다.
   그런데 app_config 는 대표·운영자만 쓸 수 있는 표라서,
   팀원이 등록하다가 새 종류를 만나도 넣을 수가 없었다.

   실제로 전화를 돌리는 사람이 새 DB 종류를 제일 먼저 만난다.
   그때마다 대표에게 부탁해야 하면 아무도 안 넣고 '일반' 으로 뭉친다.
   그러면 종류별 타율이라는 것 자체가 의미를 잃는다.

   바뀌는 것:
     - db_sources 한 줄만 팀원 누구나 넣고 고칠 수 있다
     - 나머지 설정(owner_email, pay, 스키마 버전 등)은 그대로 대표만
     - 지우는 정책은 만들지 않는다

   고객 자료는 건드리지 않는다.

   이 파일은 어떤 상태에서 돌려도 멈추지 않는다.
   표가 없으면 만들고, 제약이 없으면 넣고, 그다음에 정책을 건다.
   몇 번을 다시 실행해도 안전하다.
   ════════════════════════════════════════════════════════════════ */

/* ── 1. 표가 없으면 만든다 ── */
create table if not exists public.app_config(
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

alter table public.app_config enable row level security;

grant select, insert, update on public.app_config to authenticated;

/* ── 2. key 에 고유 제약이 없으면 넣는다 ──
   예전에 다른 모양으로 만들어진 표라면 primary key 가 없을 수 있다.
   그 상태에서는 아래 insert 가 멈춘다. */
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

/* ── 3. 읽기는 모두에게 (이미 있으면 다시 건다) ── */
drop policy if exists app_config_select on public.app_config;

create policy app_config_select on public.app_config for select to authenticated
using (true);

/* ── 4. db_sources 한 줄만 팀원이 넣는다 ── */
drop policy if exists app_config_src_insert on public.app_config;

create policy app_config_src_insert on public.app_config for insert to authenticated
with check (key = 'db_sources');

/* ── 5. db_sources 한 줄만 팀원이 고친다 ──
   using 과 with check 를 둘 다 걸어야 다른 줄을 db_sources 로 바꿔치기할 수 없다. */
drop policy if exists app_config_src_update on public.app_config;

create policy app_config_src_update on public.app_config for update to authenticated
using (key = 'db_sources')
with check (key = 'db_sources');

/* ── 6. 아직 한 줄도 없으면 만들어 둔다 ──
   on conflict 를 쓰지 않는다. 고유 제약이 어떤 이름으로 걸려 있든 상관없이 돈다. */
insert into public.app_config(key, value)
select 'db_sources', '일반,방송,보장분석,농협,소개,지인,개척'
where not exists (select 1 from public.app_config where key = 'db_sources');

/* ── 7. 지금 어떻게 되어 있는지 보여 준다 ──
   실행하면 아래 표가 뜬다. 정책 세 줄과 종류 목록이 보이면 끝난 것이다. */
select 'policy' as what, policyname as name, cmd::text as detail
from pg_policies where tablename = 'app_config'
union all
select 'db_sources', 'value', value from public.app_config where key = 'db_sources'
order by what, name;
